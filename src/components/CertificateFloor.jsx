import { useCallback, useRef, useState } from 'react'
import CertificateCharacter from './CertificateCharacter'

const certificates = ['01', '02', '03', '04', '05']

function CertificateCard({ number }) {
  return (
    <article className="certificate-card" aria-label={`Certificate ${number} placeholder`}>
      <div className="certificate-paper">
        <span className="certificate-label">Certificate</span>
        <span className="certificate-seal" aria-hidden="true" />
        <h2>Certificate {number}</h2>
        <span className="certificate-caption">Credential details coming soon</span>
      </div>
    </article>
  )
}

function CertificateFloor() {
  const sectionRef = useRef(null)
  const [loadError, setLoadError] = useState(false)
  const handleLoadError = useCallback(() => setLoadError(true), [])

  return (
    <section
      className="certificate-floor"
      id="certificates"
      ref={sectionRef}
      data-floor="certificates"
      aria-labelledby="certificates-title"
    >
      <div className="certificate-sticky">
        <CertificateCharacter
          sectionRef={sectionRef}
          onError={handleLoadError}
        />
        <div className="certificate-wall">
          <header className="certificate-wall-heading">
            <p className="section-kicker">Level 05</p>
            <h1 id="certificates-title">Certificates</h1>
            <p>A wall for the credentials and milestones collected along the way.</p>
          </header>

          <div className="certificate-gallery">
            <div className="certificate-row certificate-row-two">
              {certificates.slice(0, 2).map((number) => (
                <CertificateCard key={number} number={number} />
              ))}
            </div>
            <div className="certificate-row certificate-row-three">
              {certificates.slice(2).map((number) => (
                <CertificateCard key={number} number={number} />
              ))}
            </div>
          </div>
        </div>

        {loadError && <p className="certificate-error">The certificate floor scene could not be loaded.</p>}
        <nav className="certificate-navigation" aria-label="Certificate floor navigation">
          <a href="#hallway">Back to hallway</a>
          <a href="#home">Back to top</a>
        </nav>
      </div>
    </section>
  )
}

export default CertificateFloor
