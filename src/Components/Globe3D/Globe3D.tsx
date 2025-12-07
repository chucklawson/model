import { useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import * as THREE from 'three'

export default function Globe3D() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Load Earth texture - using a free NASA texture URL
  const earthTexture = useLoader(
    TextureLoader,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1200px-The_Earth_seen_from_Apollo_17.jpg'
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
        map={earthTexture}
        metalness={0.1}
        roughness={0.7}
      />
    </mesh>
  )
}
