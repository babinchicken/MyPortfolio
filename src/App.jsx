
import { useEffect } from 'react'
import './App.css'
import Landing from './components/Landing'
import FirstFloor from './components/FirstFloor'
import Staircase from './components/Staircase'
import Hallway from './components/Hallway'
import CertificateFloor from './components/CertificateFloor'

function App() {
  useEffect(() => {
    const portfolio = document.querySelector('.portfolio')
    const floors = [...(portfolio?.querySelectorAll('[data-floor]') ?? [])]
    if (!portfolio || floors.length === 0) return undefined

    let frame = 0
    const updateActiveFloor = () => {
      frame = 0
      const viewportTop = 0
      const viewportBottom = window.innerHeight
      let activeFloor = floors[0]
      let largestVisibleHeight = 0

      for (const floor of floors) {
        const bounds = floor.getBoundingClientRect()
        const visibleHeight = Math.max(
          0,
          Math.min(bounds.bottom, viewportBottom) - Math.max(bounds.top, viewportTop),
        )
        if (visibleHeight > largestVisibleHeight) {
          largestVisibleHeight = visibleHeight
          activeFloor = floor
        }
      }

      for (const floor of floors) {
        floor.classList.toggle('floor-hidden', floor !== activeFloor)
      }
    }

    const scheduleFloorUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateActiveFloor)
    }

    window.addEventListener('scroll', scheduleFloorUpdate, { passive: true })
    window.addEventListener('resize', scheduleFloorUpdate)
    updateActiveFloor()

    return () => {
      window.removeEventListener('scroll', scheduleFloorUpdate)
      window.removeEventListener('resize', scheduleFloorUpdate)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <main className="portfolio">
      <div className="level-transition-overlay floor-transition" aria-hidden="true" />
      <div className="level-transition-overlay staircase-transition" aria-hidden="true" />
      <div className="level-transition-overlay hallway-transition" aria-hidden="true" />
      <div className="level-transition-overlay certificate-transition" aria-hidden="true" />
      <Landing />
      <FirstFloor />
      <Staircase />
      <Hallway />
      <CertificateFloor />
    </main>
  )
}

export default App
