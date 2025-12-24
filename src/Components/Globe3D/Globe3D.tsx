import { useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

export default function Globe3D() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Load day and night Earth textures from local files
  const [dayTexture, nightTexture] = useLoader(
    TextureLoader,
    [
      '/textures/earth_day.jpg',    // Day side - Earth surface
      '/textures/earth_night.jpg'   // Night side - City lights
    ]
  )

  // Rotate globe on each frame
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={dayTexture}
        emissiveMap={nightTexture}
        emissive={new THREE.Color(0xffff88)}
        emissiveIntensity={1.0}
        metalness={0.0}
        roughness={0.9}
      />
    </mesh>
  )
}
