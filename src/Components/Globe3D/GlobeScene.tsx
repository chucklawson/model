import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import Globe3D from './Globe3D'
import Clouds3D from './Clouds3D'
import DollarRain from './DollarRain'
import SantaSleigh from './SantaSleigh'
import { isHolidaySeason } from '../../utils/holidayCheck'

export default function GlobeScene() {
  const showSanta = isHolidaySeason()

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-900 to-black">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        className="w-full h-full"
      >
        {/* Lighting - Sun as the main light source */}
        <ambientLight intensity={0.05} />
        <directionalLight position={[10, 10, 10]} intensity={2.0} />

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

        {/* Holiday feature: Santa orbiting the globe */}
        {showSanta && <SantaSleigh />}

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
