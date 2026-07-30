import SwiftUI
import SceneKit

@main
struct HumanBlueprintApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var marks: [Mark] = []
    @State private var selectedMark: Mark?
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.black.ignoresSafeArea()
                
                SceneKitView(marks: marks, onMarkSelected: { mark in
                    selectedMark = mark
                })
                .frame(width: geometry.size.width, height: geometry.size.height - 100)
                
                VStack {
                    Spacer()
                    VStack(spacing: 12) {
                        Text("The Human Blueprint")
                            .font(.title2.bold())
                            .foregroundStyle(.white)
                        
                        Text("Click to explore marks across 50,000 years")
                            .font(.caption)
                            .foregroundStyle(.gray)
                        
                        if let selected = selectedMark {
                            HStack {
                                Circle()
                                    .fill(eraColor(selected.era))
                                    .frame(width: 12, height: 12)
                                Text(selected.era.rawValue.capitalized)
                                    .foregroundStyle(.white)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
                        }
                    }
                    .padding(.bottom, 40)
                }
            }
        }
        .onAppear {
            marks = SampleMarksFactory.createInitialMarks()
        }
    }
    
    func eraColor(_ era: Mark.Era) -> Color {
        switch era {
        case .prehistoric: return Color(red: 0.36, green: 0.23, blue: 0.13)
        case .ancient: return Color(red: 0.48, green: 0.20, blue: 0.13)
        case .classical: return Color(red: 0.17, green: 0.29, blue: 0.42)
        case .earlyModern: return Color(red: 0.77, green: 0.63, blue: 0.35)
        case .modern: return Color(red: 0.75, green: 0.78, blue: 0.80)
        }
    }
}

struct SceneKitView: NSViewRepresentable {
    let marks: [Mark]
    let onMarkSelected: (Mark) -> Void
    
    func makeNSView(context: Context) -> SCNView {
        let scnView = SCNView()
        scnView.backgroundColor = NSColor.black
        scnView.allowsCameraControl = true
        scnView.autoenablesDefaultLighting = true
        
        let scene = SCNScene()
        scnView.scene = scene
        
        let cameraNode = SCNNode()
        cameraNode.camera = SCNCamera()
        cameraNode.position = SCNVector3(0, 0, 8)
        scene.rootNode.addChildNode(cameraNode)
        
        let clickGesture = NSClickGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleClick(_:)))
        scnView.addGestureRecognizer(clickGesture)
        
        return scnView
    }
    
    func updateNSView(_ scnView: SCNView, context: Context) {
        guard let scene = scnView.scene else { return }
        
        scene.rootNode.childNodes.filter { $0.name?.hasPrefix("mark_") == true }.forEach { $0.removeFromParentNode() }
        
        for mark in marks {
            let node = createMarkNode(mark: mark)
            scene.rootNode.addChildNode(node)
        }
        
        context.coordinator.marks = marks
        context.coordinator.onMarkSelected = onMarkSelected
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(marks: marks, onMarkSelected: onMarkSelected)
    }
    
    class Coordinator: NSObject {
        var marks: [Mark]
        var onMarkSelected: (Mark) -> Void
        
        init(marks: [Mark], onMarkSelected: @escaping (Mark) -> Void) {
            self.marks = marks
            self.onMarkSelected = onMarkSelected
        }
        
        @objc func handleClick(_ gesture: NSClickGestureRecognizer) {
            guard let scnView = gesture.view as? SCNView else { return }
            let location = gesture.location(in: scnView)
            let hitResults = scnView.hitTest(location, options: nil)
            
            if let hit = hitResults.first, let name = hit.node.name, name.hasPrefix("mark_") {
                let markId = String(name.dropFirst(5))
                if let mark = marks.first(where: { $0.id == markId }) {
                    SCNTransaction.begin()
                    SCNTransaction.animationDuration = 0.3
                    hit.node.geometry?.firstMaterial?.emission.contents = NSColor.white
                    SCNTransaction.commit()
                    onMarkSelected(mark)
                }
            }
        }
    }
    
    private func createMarkNode(mark: Mark) -> SCNNode {
        let color = colorForEra(mark.era)
        
        let geometry = SCNBox(width: 0.6, height: 0.6, length: 0.1, chamferRadius: 0.05)
        let material = SCNMaterial()
        material.diffuse.contents = color
        material.emission.contents = color.withAlphaComponent(0.4)
        material.isDoubleSided = true
        geometry.materials = [material]
        
        let node = SCNNode(geometry: geometry)
        node.name = "mark_\(mark.id)"
        
        let radius: Float = 4.0
        node.position = SCNVector3(mark.position.x * radius, mark.position.y * radius, mark.position.z * radius)
        
        let glowGeometry = SCNBox(width: 0.7, height: 0.7, length: 0.12, chamferRadius: 0.06)
        let glowMaterial = SCNMaterial()
        glowMaterial.diffuse.contents = color.withAlphaComponent(0.15)
        glowMaterial.emission.contents = color.withAlphaComponent(0.6)
        glowMaterial.isDoubleSided = true
        glowGeometry.materials = [glowMaterial]
        node.addChildNode(SCNNode(geometry: glowGeometry))
        
        let pulse = SCNAction.sequence([SCNAction.scale(to: 1.1, duration: 2.0), SCNAction.scale(to: 1.0, duration: 2.0)])
        node.runAction(SCNAction.repeatForever(pulse))
        
        return node
    }
    
    private func colorForEra(_ era: Mark.Era) -> NSColor {
        switch era {
        case .prehistoric: return NSColor(red: 0.36, green: 0.23, blue: 0.13, alpha: 1.0)
        case .ancient: return NSColor(red: 0.48, green: 0.20, blue: 0.13, alpha: 1.0)
        case .classical: return NSColor(red: 0.17, green: 0.29, blue: 0.42, alpha: 1.0)
        case .earlyModern: return NSColor(red: 0.77, green: 0.63, blue: 0.35, alpha: 1.0)
        case .modern: return NSColor(red: 0.75, green: 0.78, blue: 0.80, alpha: 1.0)
        }
    }
}

struct Mark: Identifiable, Hashable {
    let id: String
    let position: SIMD3<Float>
    let era: Era
    let type: MarkType
    let hasImage: Bool
    
    enum Era: String, CaseIterable {
        case prehistoric, ancient, classical, earlyModern, modern
    }
    
    enum MarkType: String {
        case pictograph, petroglyph, inscription, manuscript, graffiti, signature, symbol
    }
}

enum SampleMarksFactory {
    static func createInitialMarks() -> [Mark] {
        [
            Mark(id: "altamira", position: SIMD3<Float>(0.1, 0.5, 0.8), era: .prehistoric, type: .pictograph, hasImage: true),
            Mark(id: "chauvet", position: SIMD3<Float>(-0.3, 0.2, 0.9), era: .prehistoric, type: .pictograph, hasImage: true),
            Mark(id: "lascaux", position: SIMD3<Float>(0.5, -0.1, 0.85), era: .prehistoric, type: .pictograph, hasImage: true),
            Mark(id: "egypt", position: SIMD3<Float>(-0.5, 0.6, 0.6), era: .ancient, type: .inscription, hasImage: true),
            Mark(id: "mesopotamia", position: SIMD3<Float>(0.4, 0.4, 0.75), era: .ancient, type: .inscription, hasImage: false),
            Mark(id: "maya", position: SIMD3<Float>(-0.2, -0.4, 0.9), era: .ancient, type: .inscription, hasImage: true),
            Mark(id: "greek", position: SIMD3<Float>(0.6, 0.1, 0.79), era: .classical, type: .inscription, hasImage: true),
            Mark(id: "roman", position: SIMD3<Float>(-0.7, -0.2, 0.68), era: .classical, type: .inscription, hasImage: true),
            Mark(id: "byzantine", position: SIMD3<Float>(0.2, 0.7, 0.68), era: .classical, type: .manuscript, hasImage: false),
            Mark(id: "gutenberg", position: SIMD3<Float>(-0.4, 0.3, 0.87), era: .earlyModern, type: .manuscript, hasImage: true),
            Mark(id: "davinci", position: SIMD3<Float>(0.8, -0.3, 0.52), era: .earlyModern, type: .manuscript, hasImage: true),
            Mark(id: "michelangelo", position: SIMD3<Float>(-0.1, -0.6, 0.79), era: .earlyModern, type: .inscription, hasImage: false),
            Mark(id: "graffiti", position: SIMD3<Float>(0.3, -0.5, 0.8), era: .modern, type: .graffiti, hasImage: true),
            Mark(id: "signature", position: SIMD3<Float>(-0.6, 0.5, 0.62), era: .modern, type: .signature, hasImage: false),
            Mark(id: "symbol", position: SIMD3<Float>(0.0, 0.0, 1.0), era: .modern, type: .symbol, hasImage: true),
        ]
    }
}