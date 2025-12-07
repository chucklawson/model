import { useEffect } from 'react'
import GlobeScene from '../../Components/Globe3D/GlobeScene'

export default function HomePage() {
  useEffect(() => {
    document.title = "Home"

    // Load Google Font for calligraphic style
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Optional header overlay */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-6">
        <h1
          className="text-6xl text-white text-center drop-shadow-lg"
          style={{ fontFamily: "'Great Vibes', cursive" }}
        >
          Welcome to Your Portfolio
        </h1>
      </header>

      {/* 3D Scene */}
      <GlobeScene />
    </div>
  )
}
