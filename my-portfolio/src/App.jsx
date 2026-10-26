
import './App.css'

const projects = [
  { title: 'Senior Support', subtitle: 'Full Stack Web App' },
  { title: 'ThaKipa', subtitle: '3D Print Marketplace' },
  { title: 'Jewelry & Resin', subtitle: 'Design + 3D Print' },
  { title: 'Khabari Dai', subtitle: 'AI News Videos' },
  { title: 'More Projects', subtitle: 'And lots more...' },
]

function App() {
  return (
    <main className="portfolio">
      <section className="hero-screen" id="home">
        <header className="project-gallery">
        </header>



        <a className="scroll-cue" href="#explore">
          <span>Scroll to explore</span>
          <span className="scroll-cue-arrow" aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="explore-section" id="explore">
        <div className="explore-content">
          <p className="section-kicker">Selected work</p>
          <h2>Projects</h2>
          <ul className="project-list">
            {projects.map((project) => (
              <li className="project-row" key={project.title}>
                <h3>{project.title}</h3>
                <p>{project.subtitle}</p>
              </li>
            ))}
          </ul>
        </div>

        <footer>
          <span>© 2026 Babin Tandukar</span>
          <nav>
            <a href="#home">Home</a>
            <a href="#explore">Projects</a>
            <a href="mailto:hello@example.com">Contact</a>
          </nav>
        </footer>
      </section>
    </main>
  )
}

export default App
