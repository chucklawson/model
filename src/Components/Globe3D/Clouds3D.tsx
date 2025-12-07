import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Clouds3D() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Rotate clouds slower than Earth for parallax effect
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.05, 64, 64]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent={true}
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
