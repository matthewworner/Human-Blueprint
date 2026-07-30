import SwiftUI
import RealityKit
import simd

// ============================================================
// THE HUMAN BLUEPRINT — Apple Vision Pro
// ============================================================
// A spatial experience of 50,000 years of human mark-making
// Not art history. Mark-making consciousness.
//
// Core: Gaze = navigation, dwell = connection, rupture = displacement
// ============================================================

@main
struct HumanBlueprintApp: App {
    var body: some SwiftUI.Scene {
        #if targetEnvironment(simulator)
        WindowGroup {
            ContentView()
        }
        #else
        WindowGroup {
            ContentView()
        }
        ImmersiveSpace(id: "mainSpace") {
            MarkWorldContent()
        }
        #endif
    }
}

// Content view that opens immersive space on device
struct ContentView: View {
    @Environment(\.openImmersiveSpace) var openImmersiveSpace
    @State private var showImmersive = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 20) {
                Text("The Human Blueprint")
                    .font(.title)
                    .foregroundStyle(.white)
                
                Text("50,000 years of mark-making")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
                
                Button(showImmersive ? "Entering..." : "Begin Experience") {
                    Task {
                        showImmersive = true
                        await openImmersiveSpace(id: "mainSpace")
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        #if !targetEnvironment(simulator)
        .onAppear {
            Task {
                await openImmersiveSpace(id: "mainSpace")
            }
        }
        #endif
    }
}

// ============================================================
// MARK MODEL
// ============================================================

struct Mark: Identifiable, Codable, Hashable {
    let id: String
    let position: SIMD3<Float>
    let era: Era
    let type: MarkType
    let hasImage: Bool
    
    enum Era: String, Codable, CaseIterable {
        case prehistoric   // 50,000 BCE - 10,000 BCE — warm amber, ochre
        case ancient      // 10,000 BCE - 0 CE — deep red, sienna
        case classical    // 0 CE - 1500 CE — cool blues, verdigris
        case earlyModern  // 1500 CE - 1800 CE — warm sepia, gold
        case modern       // 1800 CE - present — stark whites, chrome
        
        var color: UIColor {
            switch self {
            case .prehistoric: return UIColor(red: 0.36, green: 0.23, blue: 0.13, alpha: 1.0)
            case .ancient: return UIColor(red: 0.48, green: 0.20, blue: 0.13, alpha: 1.0)
            case .classical: return UIColor(red: 0.17, green: 0.29, blue: 0.42, alpha: 1.0)
            case .earlyModern: return UIColor(red: 0.77, green: 0.63, blue: 0.35, alpha: 1.0)
            case .modern: return UIColor(red: 0.75, green: 0.78, blue: 0.80, alpha: 1.0)
            }
        }
        
        var audioFrequency: Float {
            switch self {
            case .prehistoric: return 80
            case .ancient: return 120
            case .classical: return 200
            case .earlyModern: return 300
            case .modern: return 500
            }
        }
    }
    
    enum MarkType: String, Codable, CaseIterable {
        case handprint
        case cavePainting = "cave_painting"
        case petroglyph
        case pictograph
        case glyph
        case scribble
        case signature
        case tally
        case symbol
        case figure
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Mark, rhs: Mark) -> Bool {
        lhs.id == rhs.id
    }
}

// ============================================================
// MARK ENTITY FACTORY
// ============================================================

enum MarkEntityFactory {
    
    /// Creates an interactive mark entity that responds to eye gaze
    /// THE THREE COMPONENTS: Collision + InputTarget + HoverEffect
    /// makes RealityKit automatically detect gaze and show visual feedback
    static func createMarkEntity(from mark: Mark, size: Float = 0.4) -> ModelEntity {
        let mesh = MeshResource.generatePlane(width: size, height: size)
        
        // Use PhysicallyBasedMaterial with blending for transparency
        var material = PhysicallyBasedMaterial()
        material.baseColor = .init(tint: mark.era.color, texture: nil)
        material.blending = .transparent(opacity: .init(floatLiteral: 0.85))
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = mark.id
        entity.position = mark.position
        entity.orientation = orientation(toward: .zero, from: mark.position)
        
        // Enable gaze interaction — the magic
        entity.generateCollisionShapes(recursive: false)
        entity.components.set(InputTargetComponent())
        entity.components.set(HoverEffectComponent())
        
        return entity
    }
    
    private static func orientation(toward target: SIMD3<Float>, from position: SIMD3<Float>) -> simd_quatf {
        // Use look(at:) method to orient entity toward target
        let tempEntity = Entity()
        tempEntity.position = position
        tempEntity.look(at: target, from: position, upVector: SIMD3<Float>(0, 1, 0), relativeTo: nil)
        return tempEntity.orientation
    }
}

// ============================================================
// SPATIAL AUDIO ENTITY
// ============================================================

enum SpatialAudioEntityFactory {
    
    static func createAudioSource(for mark: Mark) -> Entity {
        let audioEntity = Entity()
        audioEntity.name = "\(mark.id)_audio"
        audioEntity.position = mark.position
        
        audioEntity.spatialAudio = SpatialAudioComponent(
            directivity: .beam(focus: 0.3)
        )
        
        return audioEntity
    }
}

// ============================================================
// ATTENTION MODEL
// ============================================================

class AttentionModel: ObservableObject {
    
    @Published var currentTarget: String?
    @Published var gazeStartTime: Date?
    @Published var returnCounts: [String: Int] = [:]
    @Published var avoidPatterns: Set<String> = []
    
    let dwellThreshold: TimeInterval = 1.5
    
    var currentDwellDuration: TimeInterval {
        guard let start = gazeStartTime else { return 0 }
        return Date().timeIntervalSince(start)
    }
    
    var isDwelling: Bool {
        currentDwellDuration >= dwellThreshold
    }
    
    func gazeBegan(on markId: String) {
        guard !markId.isEmpty else { return }
        currentTarget = markId
        gazeStartTime = Date()
    }
    
    func gazeEnded(on markId: String, dwelled: Bool) {
        guard !markId.isEmpty else { return }
        if dwelled && currentDwellDuration >= dwellThreshold {
            returnCounts[markId, default: 0] += 1
        } else if currentDwellDuration < 0.5 {
            avoidPatterns.insert(markId)
        }
        currentTarget = nil
        gazeStartTime = nil
    }
    
    /// Reset all tracking state
    func reset() {
        currentTarget = nil
        gazeStartTime = nil
        returnCounts.removeAll()
        avoidPatterns.removeAll()
    }
}

// ============================================================
// RUPTURE ENGINE
// ============================================================

class RuptureEngine: ObservableObject {
    
    @Published var lastRuptureTime: Date?
    @Published var ruptureCount: Int = 0
    
    let minimumInterval: TimeInterval = 45.0
    let minimumGazeCount: Int = 3
    let minimumAvoidCount: Int = 3
    let maximumRuptures: Int = 10
    
    /// Evaluate if rupture should trigger based on attention patterns
    /// Returns true only if:
    /// - Minimum interval (45s) has passed since last rupture
    /// - Rupture count hasn't exceeded maximum (10)
    /// - Attention patterns show user is getting comfortable or avoiding
    func shouldRupture(attention: AttentionModel) -> Bool {
        // Check minimum interval
        if let last = lastRuptureTime {
            let elapsed = Date().timeIntervalSince(last)
            if elapsed < minimumInterval { return false }
        }
        
        // Check maximum ruptures
        if ruptureCount >= maximumRuptures { return false }
        
        // Check attention patterns
        let returnCount = attention.returnCounts.count
        let avoidCount = attention.avoidPatterns.count
        
        // Trigger rupture if user is:
        // - Returning to same marks repeatedly (comfort zone)
        // - Avoiding too many different marks (resistance)
        // Must meet BOTH threshold requirements to prevent false triggers
        let shouldReturn = returnCount >= minimumGazeCount
        let shouldAvoid = avoidCount >= minimumAvoidCount
        
        return shouldReturn || shouldAvoid
    }
    
    func recordRupture() {
        lastRuptureTime = Date()
        ruptureCount += 1
    }
    
    func reset() {
        lastRuptureTime = nil
        ruptureCount = 0
    }
}

// ============================================================
// CONNECTION TRACKER
// ============================================================

class ConnectionTracker: ObservableObject {
    
    @Published var connections: [(from: String, to: String)] = []
    
    func addConnection(from: String, to: String) {
        if !connections.contains(where: { ($0.from == from && $0.to == to) || ($0.from == to && $0.to == from) }) {
            connections.append((from: from, to: to))
        }
    }
    
    var connectedMarkCount: Int {
        var marks = Set<String>()
        for c in connections {
            marks.insert(c.from)
            marks.insert(c.to)
        }
        return marks.count
    }
    
    func reset() {
        connections = []
    }
}

// ============================================================
// AMBIENT AUDIO ENGINE
// ============================================================

class AmbientAudioEngine: ObservableObject {
    
    private var currentEra: Mark.Era = .prehistoric
    
    func start() {
        // Spatial audio is handled by RealityKit's SpatialAudioComponent
        // No AVAudioSession setup needed for visionOS spatial audio
    }
    
    func createAudioSource(for mark: Mark) -> Entity {
        let audioEntity = Entity()
        audioEntity.name = "\(mark.id)_audio"
        audioEntity.position = mark.position
        audioEntity.spatialAudio = SpatialAudioComponent(
            directivity: .beam(focus: 0.3),
            distanceAttenuation: .rolloff(factor: 1.2)
        )
        return audioEntity
    }
    
    func fadeToEra(_ era: Mark.Era) {
        currentEra = era
    }
    
    func cut() {
        // Cut all spatial audio
    }
    
    func reform() {
        // Gradually bring back
    }
    
    func stop() {
        // Stop all audio
    }
}

// ============================================================
// SAMPLE MARKS CREATION
// ============================================================

enum SampleMarksFactory {
    
    static func createInitialMarks() -> [Mark] {
        let radius: Float = 6.0
        
        return [
            // Prehistoric — warm amber, ochre
            Mark(id: "chauvet_hand", position: randomSphere(radius: radius), era: .prehistoric, type: .handprint, hasImage: true),
            Mark(id: "lascaux_horse", position: randomSphere(radius: radius), era: .prehistoric, type: .cavePainting, hasImage: true),
            Mark(id: "altamira_bison", position: randomSphere(radius: radius), era: .prehistoric, type: .cavePainting, hasImage: false),
            Mark(id: "sulawesi_hand", position: randomSphere(radius: radius), era: .prehistoric, type: .handprint, hasImage: true),
            Mark(id: "kakadu_spiral", position: randomSphere(radius: radius), era: .prehistoric, type: .petroglyph, hasImage: false),
            
            // Ancient — deep red, sienna
            Mark(id: "egypt_eye", position: randomSphere(radius: radius), era: .ancient, type: .glyph, hasImage: true),
            Mark(id: "mesopotamia_cylinder", position: randomSphere(radius: radius), era: .ancient, type: .symbol, hasImage: false),
            Mark(id: "harappa_seal", position: randomSphere(radius: radius), era: .ancient, type: .symbol, hasImage: true),
            Mark(id: "chin_jade", position: randomSphere(radius: radius), era: .ancient, type: .glyph, hasImage: false),
            Mark(id: "norse_rock", position: randomSphere(radius: radius), era: .ancient, type: .petroglyph, hasImage: false),
            
            // Classical — cool blues, verdigris
            Mark(id: "greek_vase", position: randomSphere(radius: radius), era: .classical, type: .pictograph, hasImage: true),
            Mark(id: "roman_fresco", position: randomSphere(radius: radius), era: .classical, type: .pictograph, hasImage: false),
            Mark(id: "mayan_glyph", position: randomSphere(radius: radius), era: .classical, type: .glyph, hasImage: true),
            Mark(id: "byzantine_icon", position: randomSphere(radius: radius), era: .classical, type: .figure, hasImage: false),
            
            // Early Modern — warm sepia, gold
            Mark(id: "manuscript_miniature", position: randomSphere(radius: radius), era: .earlyModern, type: .figure, hasImage: true),
            Mark(id: "durer_melancholia", position: randomSphere(radius: radius), era: .earlyModern, type: .symbol, hasImage: false),
            Mark(id: "japanese_woodblock", position: randomSphere(radius: radius), era: .earlyModern, type: .pictograph, hasImage: false),
            
            // Modern — stark whites, chrome
            Mark(id: "picasso_sketch", position: randomSphere(radius: radius), era: .modern, type: .figure, hasImage: true),
            Mark(id: "basquiat_graffiti", position: randomSphere(radius: radius), era: .modern, type: .scribble, hasImage: true),
            Mark(id: "receipt_sig", position: randomSphere(radius: radius), era: .modern, type: .signature, hasImage: false),
            Mark(id: "bathroom_wall", position: randomSphere(radius: radius), era: .modern, type: .scribble, hasImage: false),
        ]
    }
    
    static func randomSphere(radius: Float) -> SIMD3<Float> {
        let theta = Float.random(in: 0...(2 * .pi))
        let phi = acos(Float.random(in: -1...1))
        return SIMD3<Float>(
            radius * sin(phi) * cos(theta),
            radius * sin(phi) * sin(theta),
            radius * cos(phi)
        )
    }
    
    /// Generate random point on sphere with safe math
    /// Clamps acos input to prevent NaN from Float precision errors
    static func randomSphereSafe(radius: Float) -> SIMD3<Float> {
        let theta = Float.random(in: 0...(2 * .pi))
        // Clamp to [-1, 1] to handle Float precision edge cases
        let cosPhiValue = Float.random(in: -1...1)
        let phi = acos(min(max(cosPhiValue, -1.0), 1.0))
        return SIMD3<Float>(
            radius * sin(phi) * cos(theta),
            radius * sin(phi) * sin(theta),
            radius * cos(phi)
        )
    }
    
    static func shuffled() -> [Mark] {
        var marks = createInitialMarks()
        marks.shuffle()
        return marks
    }
}

// ============================================================
// THREAD RENDERER
// ============================================================

/// Creates visual thread between connected marks
/// Thread appears as a thin line with particle texture
enum ThreadRenderer {
    
    // Thread visual properties
    private static let threadRadius: Float = 0.008  // Very thin line
    private static let threadColor = UIColor(red: 1.0, green: 0.94, blue: 0.86, alpha: 0.6)  // Warm white
    
    /// Create a thread entity between two marks
    static func createThread(from: SIMD3<Float>, to: SIMD3<Float>) -> Entity {
        let entity = Entity()
        entity.name = "threadEntity"
        
        // Calculate length and direction
        let direction = to - from
        let length = simd_length(direction)
        
        // Handle edge case: zero-length (same position)
        guard length > 0.001 else {
            // Create tiny sphere instead of cylinder
            let mesh = MeshResource.generateSphere(radius: threadRadius)
            var material = PhysicallyBasedMaterial()
            material.baseColor = .init(tint: threadColor, texture: nil)
            material.blending = .transparent(opacity: .init(floatLiteral: 0.6))
            let meshEntity = ModelEntity(mesh: mesh, materials: [material])
            meshEntity.position = from
            entity.addChild(meshEntity)
            return entity
        }
        
        let mesh = MeshResource.generateCylinder(
            height: length,
            radius: threadRadius
        )
        
        // Create material with transparency
        var material = PhysicallyBasedMaterial()
        material.baseColor = .init(tint: threadColor, texture: nil)
        material.blending = .transparent(opacity: .init(floatLiteral: 0.6))
        
        let meshEntity = ModelEntity(mesh: mesh, materials: [material])
        
        // Position at midpoint between marks
        let midpoint = (from + to) / 2
        meshEntity.position = midpoint
        
        // Orient cylinder to point from 'from' to 'to'
        meshEntity.look(at: to, from: from, upVector: SIMD3<Float>(0, 1, 0), relativeTo: nil)
        
        entity.addChild(meshEntity)
        
        return entity
    }
    
    /// Animate thread fade out
    static func animateFadeOut(_ entity: Entity, duration: Float = 0.5, completion: @escaping () -> Void) {
        // TODO: Animate material opacity from 0.6 to 0
        // For now: immediate completion
        completion()
    }
}