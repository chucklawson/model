import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Globe3D from './Globe3D'
import Clouds3D from './Clouds3D'
import DollarRain from './DollarRain'

export default function GlobeScene() {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-900 to-black">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        className="w-full h-full"
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Background stars */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
        />

        {/* Main content */}
        <Globe3D />
        <Clouds3D />
        <DollarRain count={150} />

        {/* Camera controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={4}
          maxDistance={15}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
