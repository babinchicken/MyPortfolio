function Landing() {
  return (
    <section className="hero-screen" id="home" data-floor="home">
      <header className="project-gallery"></header>

      <a className="scroll-cue" href="#explore">
        <span>Scroll to explore</span>
        <span className="scroll-cue-arrow" aria-hidden="true">↓</span>
      </a>
    </section>
  )
}

export default Landing