import { useEffect, useRef, useState } from 'react'

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL
const contactPhone = import.meta.env.VITE_CONTACT_PHONE

function FirstFloor() {
  const [activeDetail, setActiveDetail] = useState(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (activeDetail && !dialog.open) {
      dialog.showModal()
    } else if (!activeDetail && dialog.open) {
      dialog.close()
    }
  }, [activeDetail])

  return (
    <section className="explore-section" id="explore">
      <div className="floor-scene" aria-label="Interactive room scene">
        <button
          className="room-hotspot tv-hotspot"
          type="button"
          aria-label="Open profile details"
          aria-haspopup="dialog"
          onClick={() => setActiveDetail('profile')}
        >
          <video className="tv-screen-video" autoPlay muted loop playsInline>
            <source src="/tv.mp4" type="video/mp4" />
          </video>
          <span className="hotspot-hint">Profile</span>
        </button>

        <button
          className="room-hotspot phone-hotspot"
          type="button"
          aria-label="Open contact details"
          aria-haspopup="dialog"
          onClick={() => setActiveDetail('contact')}
        >
          <img className="phone-art" src="/tv.png" alt="" />
          <span className="hotspot-hint">Contact</span>
        </button>
      </div>

      <div className="explore-content">
        <p className="section-kicker">Selected work</p>
        <h2>Projects</h2>
        {/* <ul className="project-list">
          {projects.map((project) => (
            <li className="project-row" key={project.title}>
              <h3>{project.title}</h3>
              <p>{project.subtitle}</p>
            </li>
          ))}
        </ul> */}
      </div>

      {/* <footer>
        <span>© 2026 Babin Tandukar</span>
        <nav>
          <a href="#home">Home</a>
          <a href="#explore">Projects</a>
          <a href="mailto:hello@example.com">Contact</a>
        </nav>
      </footer> */}

      <dialog
        className="detail-dialog"
        ref={dialogRef}
        aria-labelledby="detail-dialog-title"
        onClose={() => setActiveDetail(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <button
          className="dialog-close"
          type="button"
          aria-label="Close dialog"
          onClick={() => dialogRef.current?.close()}
        >
          ×
        </button>
        {activeDetail === 'profile' ? (
          <>
            <p className="section-kicker">The person behind the screen</p>
            <h2 id="detail-dialog-title">Babin Tandukar</h2>
            <p>Full Stack Developer building useful things with React, Laravel, and Android.</p>
          </>
        ) : activeDetail === 'contact' ? (
          <>
            <p className="section-kicker">Pick up the phone</p>
            <h2 id="detail-dialog-title">Let’s talk</h2>
            <p>Have a project, collaboration, or opportunity in mind? Get in touch.</p>
            <div className="dialog-actions">
              <a className="dialog-action" href={`tel:${contactPhone}`}>Call me</a>
              <a className="dialog-action" href={`mailto:${contactEmail}`}>Send email</a>
            </div>
          </>
        ) : null}
      </dialog>
    </section>
  )
}

export default FirstFloor