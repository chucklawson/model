import { useRef, Suspense, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function SantaSleigh() {
  const groupRef = useRef<THREE.Group>(null)
  const angle = useRef(0)

  // Orbit around the globe
  useFrame((_state, delta) => {
    if (groupRef.current) {
      angle.current += delta * 0.3 // Speed of orbit

      // Orbital path around the globe (radius 3.5, slightly outside the globe)
      const radius = 3.5
      const x = Math.cos(angle.current) * radius
      const z = Math.sin(angle.current) * radius
      const y = Math.sin(angle.current * 2) * 0.3 // Slight wave motion

      groupRef.current.position.set(x, y, z)

      // Make Santa face forward in his orbit direction
      groupRef.current.lookAt(
        Math.cos(angle.current + Math.PI * 0.5) * radius,
        y,
        Math.sin(angle.current + Math.PI * 0.5) * radius
      )
    }
  })

  return (
    <group ref={groupRef}>
      {/* Lighting to illuminate Santa */}
      <pointLight position={[0, 1, 0]} intensity={3} color="#ffffff" distance={5} />
      <pointLight position={[0, -1, 0]} intensity={1.5} color="#ffffff" distance={5} />

      <Suspense fallback={<FallbackSanta />}>
        <SantaModel />
      </Suspense>

      {/* Trail sparkles - magical dust trail */}
      <mesh position={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={4}
        />
      </mesh>
      <mesh position={[-0.5, 0.05, 0]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={3.5}
        />
      </mesh>
      <mesh position={[-0.7, -0.03, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={3}
        />
      </mesh>
      <mesh position={[-0.9, 0.02, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[-1.1, -0.04, 0]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[-1.3, 0.03, 0]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh position={[-1.5, -0.02, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[-1.7, 0.01, 0]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}

// Santa 3D Model Component
function SantaModel() {
  // Load the GLTF model from public folder
  const { scene } = useGLTF('/models/santa.glb')

  useEffect(() => {
    // Traverse the model to set up shadows
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  // Clone the scene to avoid issues with reusing the same object
  const clonedScene = scene.clone()

  return (
    <primitive
      object={clonedScene}
      scale={0.001}  // Correct scale based on model dimensions (946 units wide)
      rotation={[0, Math.PI / 2, 0]}
    />
  )
}

// Fallback while model loads (simple placeholder)
function FallbackSanta() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.8]} />
      <meshStandardMaterial
        color="#ff0000"
        emissive="#ff0000"
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

// Preload the model
useGLTF.preload('/models/santa.glb')
