
import './App.css'
import Landing from './components/Landing'
import FirstFloor from './components/FirstFloor'
import Staircase from './components/Staircase'
import Hallway from './components/Hallway'

function App() {
  return (
    <main className="portfolio">
      <div className="level-transition-overlay floor-transition" aria-hidden="true" />
      <div className="level-transition-overlay staircase-transition" aria-hidden="true" />
      <div className="level-transition-overlay hallway-transition" aria-hidden="true" />
      <Landing />
      <FirstFloor />
      <Staircase />
      <Hallway />
    </main>
  )
}

export default App
