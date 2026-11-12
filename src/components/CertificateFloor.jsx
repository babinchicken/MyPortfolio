import { useCallback, useEffect, useRef, useState } from 'react'
import careerProfile from '../assets/data/career_profile.json'
import CareerProfileCard from './atoms/CareerProfileCard'
import CertificateCharacter from './CertificateCharacter'

const profileSections = [
  { key: 'certificates', title: 'Certificates', entries: careerProfile.certificates },
  { key: 'education', title: 'Education', entries: careerProfile.education },
  { key: 'work_experience', title: 'Work experience', entries: careerProfile.work_experience },
]

function formatMonth(value) {
  const [year, month] = value.split('-')
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' })
    .format(new Date(Number(year), Number(month) - 1))
}

function getPeriod(entry, category) {
  if (category === 'work_experience') {
    return `${formatMonth(entry.start_date)} – ${formatMonth(entry.end_date)}`
  }
  return `${entry.start_year} – ${entry.end_year}`
}

function CertificateFloor() {
  const sectionRef = useRef(null)
  const dialogRef = useRef(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const handleLoadError = useCallback(() => setLoadError(true), [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (selectedEntry && !dialog.open) dialog.showModal()
    else if (!selectedEntry && dialog.open) dialog.close()
  }, [selectedEntry])

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
            <h1 id="certificates-title">Career profile</h1>
          </header>

          <div className="career-profile-layers">
            {profileSections.map(({ key, title, entries }) => (
              <section className={`career-profile-layer ${key}`} key={key} aria-labelledby={`${key}-title`}>
                <h2 id={`${key}-title`}>{title}</h2>
                {entries.length ? (
                  <div className="career-profile-cards">
                    {entries.map((entry, index) => (
                      <CareerProfileCard
                        key={`${key}-${entry.institution ?? entry.company}-${index}`}
                        entry={entry}
                        category={key}
                        onOpen={() => setSelectedEntry({ entry, category: key, title })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="career-profile-empty">Certificates will be added here.</p>
                )}
              </section>
            ))}
          </div>
        </div>

        {loadError && <p className="certificate-error">The certificate floor scene could not be loaded.</p>}
        <nav className="certificate-navigation" aria-label="Certificate floor navigation">
          <a href="#hallway">Back to hallway</a>
          <a href="#home">Back to top</a>
        </nav>
      </div>

      <dialog
        className="career-profile-dialog"
        ref={dialogRef}
        aria-labelledby="career-profile-dialog-title"
        onClose={() => setSelectedEntry(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        {selectedEntry && (
          <>
            <button
              className="career-profile-dialog-close"
              type="button"
              aria-label="Close details"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
            <p className="career-profile-dialog-category">{selectedEntry.title}</p>
            <h2 id="career-profile-dialog-title">
              {selectedEntry.entry.job_title ?? selectedEntry.entry.qualification}
            </h2>
            <p className="career-profile-dialog-organization">
              {selectedEntry.entry.company ?? selectedEntry.entry.institution}
            </p>
            <p className="career-profile-dialog-period">
              {getPeriod(selectedEntry.entry, selectedEntry.category)}
            </p>
            {selectedEntry.entry.location && (
              <p className="career-profile-dialog-location">{selectedEntry.entry.location}</p>
            )}
            {selectedEntry.entry.responsibilities?.length > 0 && (
              <ul className="career-profile-dialog-responsibilities">
                {selectedEntry.entry.responsibilities.map((responsibility) => (
                  <li key={responsibility}>{responsibility}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </dialog>
    </section>
  )
}

export default CertificateFloor
