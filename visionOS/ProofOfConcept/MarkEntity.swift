import SwiftUI
import RealityKit

// MARK: - The Mark
// A mark is a textured plane floating in space
// It responds to gaze automatically via HoverEffectComponent

struct Mark: Identifiable {
    let id: String
    let position: SIMD3<Float>
    let textureName: String
    let era: Era
    
    enum Era: String, CaseIterable {
        case prehistoric = "Prehistoric"
        case ancient = "Ancient"  
        case classical = "Classical"
        case earlyModern = "Early Modern"
        case modern = "Modern"
        
        var color: UIColor {
            switch self {
            case .prehistoric: return UIColor(red: 0.36, green: 0.23, blue: 0.13, alpha: 1)
            case .ancient: return UIColor(red: 0.48, green: 0.32, blue: 0.19, alpha: 1)
            case .classical: return UIColor(red: 0.17, green: 0.29, blue: 0.42, alpha: 1)
            case .earlyModern: return UIColor(red: 0.77, green: 0.64, blue: 0.35, alpha: 1)
            case .modern: return UIColor(red: 0.29, green: 0.42, blue: 0.54, alpha: 1)
            }
        }
    }
}

// MARK: - Mark Entity Factory
// Creates RealityKit entities from mark data

enum MarkEntityFactory {
    
    /// Creates an interactive mark entity that responds to eye gaze
    static func createMarkEntity(from mark: Mark, size: Float = 0.5) -> Entity {
        
        // Create the mesh (a plane)
        let mesh = MeshResource.generatePlane(width: size, height: size)
        
        // Load or create texture
        let material = createMaterial(for: mark)
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = mark.id
        entity.position = mark.position
        
        // THE MAGIC: These three components make the entity respond to GAZE
        // No ARKit needed — RealityKit handles it automatically
        
        // 1. Collision for raycasting
        entity.generateCollisionShapes(recursive: false)
        
        // 2. Input target for gaze recognition  
        entity.components.set(InputTargetComponent())
        
        // 3. Hover effect — this is what makes it respond visually
        entity.components.set(HoverEffectComponent())
        
        // Optional: custom hover effect (highlight color)
        // entity.components.set(HoverEffectComponent(.highlight(color: .white)))
        
        return entity
    }
    
    /// Creates a textured material for the mark
    /// For MVP: solid color based on era
    /// Later: load actual image textures
    private static func createMaterial(for mark: Mark) -> Material {
        var material = SimpleMaterial()
        material.color = .init(tint: mark.era.color, texture: nil)
        material.blending = .transparent(opacity: .init(floatLiteral: 0.9))
        return material
    }
}

// MARK: - Anchor Mark Entity
// Special marks with real images (anchor marks in the collection)

enum AnchorMarkFactory {
    
    /// Creates an anchor mark with a real texture
    /// The texture should be bundled as a .ktx or .png file
    static func createAnchorEntity(
        for mark: Mark,
        size: Float = 0.5,
        textureName: String
    ) -> Entity {
        
        let mesh = MeshResource.generatePlane(width: size, height: size)
        
        // Try to load the texture
        var material: Material
        if let textureResource = try? TextureResource.load(named: textureName) {
            var mat = SimpleMaterial()
            mat.color = .init(tint: .white, texture: .init(textureResource))
            material = mat
        } else {
            // Fallback: era-colored material
            var mat = SimpleMaterial()
            mat.color = .init(tint: mark.era.color, texture: nil)
            material = mat
        }
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = mark.id
        entity.position = mark.position
        
        // Make it interactive
        entity.generateCollisionShapes(recursive: false)
        entity.components.set(InputTargetComponent())
        entity.components.set(HoverEffectComponent())
        
        return entity
    }
}