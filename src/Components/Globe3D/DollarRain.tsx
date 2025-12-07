import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Particle {
  position: [number, number, number]
  rotation: [number, number, number]
  speed: number
}

interface DollarRainProps {
  count?: number
}

export default function DollarRain({ count = 100 }: DollarRainProps) {
  const billsRef = useRef<THREE.InstancedMesh>(null)

  // Initialize particle positions
  const particles = useMemo<Particle[]>(() => {
    const temp: Particle[] = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          Math.random() * 8 - 4,  // X: -4 to 4
          Math.random() * 8 + 4,  // Y: 4 to 12 (above globe)
          Math.random() * 8 - 4   // Z: -4 to 4
        ],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          0
        ],
        speed: Math.random() * 0.02 + 0.01
      })
    }
    return temp
  }, [count])

  useFrame(() => {
    if (!billsRef.current) return

    particles.forEach((particle, i) => {
      // Update Y position (fall down)
      particle.position[1] -= particle.speed

      // Reset when reaching globe surface
      if (particle.position[1] < 2.1) {
        particle.position[1] = Math.random() * 4 + 8
        particle.position[0] = Math.random() * 8 - 4
        particle.position[2] = Math.random() * 8 - 4
      }

      // Update rotation (tumble)
      particle.rotation[0] += 0.01
      particle.rotation[1] += 0.01

      // Apply to instance
      const matrix = new THREE.Matrix4()
      matrix.makeRotationFromEuler(
        new THREE.Euler(...particle.rotation)
      )
      matrix.setPosition(...particle.position)
      billsRef.current!.setMatrixAt(i, matrix)
    })

    billsRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={billsRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.3, 0.15]} />
      <meshStandardMaterial
        color="#85bb65"
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.5}
      />
    </instancedMesh>
  )
}
