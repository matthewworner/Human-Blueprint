import SwiftUI
import RealityKit
import ARKit

// ============================================================
// MARK WORLD CONTENT — Main View
// ============================================================
//
// Core systems:
// - RealityView: renders marks in 3D space
// - Gaze tracking: simulates eye tracking for POC
// - Connection system: draws threads between similar marks
// - Rupture engine: displaces user when patterns emerge
//
// TODO for production:
// - ARKit eye tracking with WorldTrackingProvider
// - Actual mark images (anchor marks + generated textures)
// - Generative audio (AudioGeneratorController)
// - Particle thread system (instanced rendering)
// - Pre-computed positions (UMAP)
// ============================================================

struct MarkWorldContent: View {
    
    // MARK: State
    
    @State private var world: Entity?
    @State private var marks: [Mark] = []
    @State private var hoveredMarkId: String?
    @State private var connectionTracker = ConnectionTracker()
    @State private var attentionModel = AttentionModel()
    @State private var ruptureEngine = RuptureEngine()
    @State private var audioEngine = AmbientAudioEngine()
    @State private var isRupturing = false
    @State private var showThread = false
    @State private var threadFrom: SIMD3<Float>?
    @State private var threadTo: SIMD3<Float>?
    @State private var gazeUpdateTimer: Timer?
    
    // MARK: Body
    
    var body: some View {
        #if targetEnvironment(simulator)
        // Volume view for simulator - shows marks in a 3D window
        VolumeContentView(marks: marks)
        #else
        // Real immersive space for Vision Pro device
        RealityView { content in
            // Set up world
            let markWorld = Entity()
            markWorld.name = "markWorld"
            content.add(markWorld)
            world = markWorld
            
            // Load marks
            marks = SampleMarksFactory.createInitialMarks()
            
            for mark in marks {
                // Create visual mark entity
                let entity = MarkEntityFactory.createMarkEntity(from: mark)
                markWorld.addChild(entity)
                
                // Create spatial audio source at mark position
                let audioEntity = audioEngine.createAudioSource(for: mark)
                markWorld.addChild(audioEntity)
            }
            
            audioEngine.start()
            startGazeTracking()
            
        } update: { _ in
            // Update called when state changes
        }
        .gesture(tapGesture)
        .onAppear {
            startExperience()
        }
        .onDisappear {
            endExperience()
        }
        #endif
    }
    
    // MARK: Experience Flow
    
    private func startExperience() {
        // Marks are loaded in RealityView make closure
    }
    
    private func endExperience() {
        gazeUpdateTimer?.invalidate()
        audioEngine.stop()
        ruptureEngine.reset()
        attentionModel.reset()
    }
    
    // MARK: Gestures
    
    /// Tap gesture for selection
    /// In visionOS: gaze at entity + tap = select
    /// For POC: tap anywhere to select the currently gazed entity
    private var tapGesture: some Gesture {
        TapGesture()
            .targetedToAnyEntity()
            .onEnded { event in
                handleTap(on: event.entity)
            }
    }
    
    private func handleTap(on entity: Entity) {
        let markId = entity.name
        guard !markId.isEmpty,
              !markId.contains("_audio"),
              !markId.contains("thread") else { return }
        
        // Make connection with tapped mark
        makeConnection(to: markId)
    }
    
    private func fadeMarksIn(duration: Float) {
        // Marks fade in handled in RealityView make closure
        // For production: animate entity opacity
    }
    
    // MARK: Gaze Tracking
    
    private func startGazeTracking() {
        // Invalidate any existing timer first (prevents duplicate timers)
        gazeUpdateTimer?.invalidate()
        
        // Poll for gaze state every 100ms
        // In production: use ARKit WorldTrackingProvider with eye tracking
        gazeUpdateTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            updateGazeState()
        }
    }
    
    private func updateGazeState() {
        // Guard against rupture in progress
        guard !isRupturing else { return }
        guard let worldEntity = world else { return }
        
        // Find the entity currently being gazed at
        // In production: use ARKit eye tracking ray
        if let hoveredEntity = findGazedEntity(in: worldEntity) {
            let markId = hoveredEntity.name
            
            if hoveredMarkId != markId {
                handleGazeEnter(markId: markId, entity: hoveredEntity)
            } else {
                handleGazeDwell(markId: markId)
            }
        } else if let previousMark = hoveredMarkId {
            handleGazeExit(markId: previousMark)
        }
    }
    
    private func findGazedEntity(in entity: Entity) -> Entity? {
        // Find any entity with InputTargetComponent (mark) that is being hovered
        //
        // PRODUCTION: Use ARKit WorldTrackingProvider
        // - Get eye tracking data from provider
        // - Cast ray from eye position in gaze direction
        // - Find entity hit by raycast
        //
        // POC: Return first mark entity for demo purposes
        
        for child in entity.children {
            // Check if this is a mark entity (has InputTargetComponent)
            if child.components[InputTargetComponent.self] != nil {
                // Return first mark for POC demo
                // Production: check raycast hit
                return child
            }
            
            // Recurse into children
            if let found = findGazedEntity(in: child) {
                return found
            }
        }
        
        return nil
    }
    
    // MARK: Gaze Handlers
    
    private func handleGazeEnter(markId: String, entity: Entity) {
        // Prevent duplicate handling
        guard markId != hoveredMarkId else { return }
        
        hoveredMarkId = markId
        attentionModel.gazeBegan(on: markId)
        
        // Visual feedback: brighten and scale up mark
        animateMarkHighlight(entity: entity, active: true)
        
        // Audio feedback: shift to mark's era frequency
        if let mark = marks.first(where: { $0.id == markId }) {
            audioEngine.fadeToEra(mark.era)
        }
    }
    
    private func handleGazeDwell(markId: String) {
        // Check if dwell threshold reached
        // Dwell threshold defined in AttentionModel (default 1.5 seconds)
        if attentionModel.isDwelling {
            makeConnection(to: markId)
        }
    }
    
    private func handleGazeExit(markId: String) {
        let wasDwelling = attentionModel.isDwelling
        attentionModel.gazeEnded(on: markId, dwelled: wasDwelling)
        hoveredMarkId = nil
        
        // Remove visual highlight
        if let entity = findEntity(markId: markId) {
            animateMarkHighlight(entity: entity, active: false)
        }
        
        // Return audio to exploration mode
        // TODO: Implement audio return transition
    }
    
    // MARK: Connection System
    
    /// Make a connection from the dwelled mark
    /// Finds similar mark (same type, different era) and draws thread
    private func makeConnection(to markId: String) {
        guard let mark = marks.first(where: { $0.id == markId }) else { return }
        
        // Find similar mark: same type, different era
        if let similar = findSimilarMark(to: mark) {
            // Record connection
            connectionTracker.addConnection(from: markId, to: similar.id)
            
            // Draw thread between the two marks
            showThreadBetween(mark, similar)
            
            // Check if rupture should trigger
            checkForRupture()
        }
    }
    
    /// Find a mark with same type but different era
    private func findSimilarMark(to mark: Mark) -> Mark? {
        return marks.first { m in
            m.id != mark.id &&
            m.type == mark.type &&
            m.era != mark.era
        }
    }
    
/// Show particle thread between two marks
    /// Creates a 3D line between the marks that fades over time
    private func showThreadBetween(_ from: Mark, _ to: Mark) {
        guard let worldEntity = world else { return }
        
        // Create thread entity
        let threadEntity = ThreadRenderer.createThread(from: from.position, to: to.position)
        threadEntity.name = "thread"
        worldEntity.addChild(threadEntity)
        
        // Store for later removal
        threadFrom = from.position
        threadTo = to.position
        showThread = true
        
        // Animate thread fade out after 3 seconds
        Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            
            // Fade out animation
            await withCheckedContinuation { continuation in
                animateThreadFadeOut(threadEntity) {
                    continuation.resume()
                }
            }
            
            // Remove thread
            threadEntity.removeFromParent()
            showThread = false
            threadFrom = nil
            threadTo = nil
        }
    }
    
    /// Animate thread fade out
    private func animateThreadFadeOut(_ entity: Entity, completion: @escaping () -> Void) {
        // Animate opacity from 1 to 0 over 0.5 seconds
        // For now: immediate removal with completion
        completion()
    }
    
    // MARK: Rupture System
    
    /// Check if rupture should trigger based on attention patterns
    private func checkForRupture() {
        if ruptureEngine.shouldRupture(attention: attentionModel) {
            triggerRupture()
        }
    }
    
    /// Trigger rupture: displace user to new region
    /// Animation sequence: tension → contraction → flash → silence → emergence
    private func triggerRupture() {
        guard !isRupturing else { return }
        
        isRupturing = true
        
        // Cut audio immediately (rupture is jarring)
        audioEngine.cut()
        
        Task {
            // Phase 1: Tension (1 second)
            // - Particles accelerate
            // - Marks vibrate subtly
            await animateTension()
            
            // Phase 2: Contraction (0.5 second)
            // - Marks appear to rush toward user
            await animateContraction()
            
            // Phase 3: Flash (0.3 second)
            // - Pure white, no image
            await animateFlash()
            
            // Phase 4: Silence (1 second)
            // - Black, no audio
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            
            // Phase 5: Move to new region
            await moveToNewRegion()
            
            // Resume audio (gradual reform)
            audioEngine.reform()
            
            isRupturing = false
            ruptureEngine.recordRupture()
            
            // Reset attention for new region
            // TODO: Optionally confront user with avoided content
        }
    }
    
    private func animateTension() async {
        // Animate marks: vibrate, particles accelerate
        // For POC: just delay
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // TODO: Animate mark positions slightly (vibration effect)
        // TODO: Accelerate particle system
    }
    
    private func animateContraction() async {
        // Animate marks rushing toward user
        // For POC: just delay
        try? await Task.sleep(nanoseconds: 500_000_000)
        
        // TODO: Animate mark scale increase (rush toward camera)
        // TODO: Add motion blur effect
    }
    
    private func animateFlash() async {
        // Flash to white
        // For POC: just delay
        try? await Task.sleep(nanoseconds: 300_000_000)
        
        // TODO: Set RealityView background to white
        // TODO: Fade all marks to opacity 0
    }
    
    /// Move to new spatial region
    /// Removes current marks, loads new shuffled arrangement
    private func moveToNewRegion() async {
        guard let worldEntity = world else { return }
        
        // Clear all marks
        // TODO: Animate out (particle dissolution)
        worldEntity.children.removeAll()
        
        // Load new marks (shuffled for different arrangement)
        // TODO: Load specific region based on rupture destination
        marks = SampleMarksFactory.shuffled()
        
        for mark in marks {
            let entity = MarkEntityFactory.createMarkEntity(from: mark)
            worldEntity.addChild(entity)
            
            let audioEntity = audioEngine.createAudioSource(for: mark)
            worldEntity.addChild(audioEntity)
        }
        
        // Fade in from black
        // TODO: Animate opacity from 0 to 1
        try? await Task.sleep(nanoseconds: 2_000_000_000)
    }
    
    // MARK: Animation Helpers
    
    private func animateMarkHighlight(entity: Entity, active: Bool) {
        // Scale animation for gaze feedback
        // Production: use withAnimation for smooth transition
        if active {
            entity.scale = SIMD3<Float>(repeating: 1.15)
        } else {
            entity.scale = SIMD3<Float>(repeating: 1.0)
        }
    }
    
    private func findEntity(markId: String) -> Entity? {
        guard let worldEntity = world else { return nil }
        return worldEntity.children.first { $0.name == markId }
    }
}

// ============================================================
// PREVIEW
// ============================================================

#Preview {
    MarkWorldContent()
}
// ============================================================
// VOLUME CONTENT VIEW — For Simulator
// ============================================================
// Shows marks in a 3D volume window for testing on macOS

struct VolumeContentView: View {
    let marks: [Mark]
    
    var body: some View {
        VStack(spacing: 0) {
            // 3D Volume
            RealityView { content in
                // Create root entity for marks
                let marksRoot = Entity()
                marksRoot.name = "marksRoot"
                content.add(marksRoot)
                
                // Create sample marks if none provided
                let displayMarks = marks.isEmpty ? SampleMarksFactory.createInitialMarks() : marks
                
                for mark in displayMarks {
                    let entity = MarkEntityFactory.createMarkEntity(from: mark)
                    marksRoot.addChild(entity)
                }
                
            } update: { _ in }
            .frame(width: 500, height: 400)
            .background(.black)
            
            // Instructions overlay
            VStack(spacing: 8) {
                Text("The Human Blueprint")
                    .font(.headline)
                Text("A spatial experience of 50,000 years of human mark-making")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }
}
