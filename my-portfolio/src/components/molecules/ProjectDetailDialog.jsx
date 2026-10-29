import { useEffect, useRef, useState } from 'react'
import ProjectImage from '../atoms/ProjectImage'
import ProjectLink from '../atoms/ProjectLink'
import ProjectStatus from '../atoms/ProjectStatus'
import {
  getProjectLinks,
  getProjectOwner,
  getProjectStack,
  projectValue,
} from './projectData'

function ProjectDetailDialog({ projects, activeIndex, imageSets, onNavigate, onClose }) {
  const dialogRef = useRef(null)
  const lightboxRef = useRef(null)
  const [activeImage, setActiveImage] = useState(0)
  const project = activeIndex === null ? null : projects[activeIndex]
  const images = activeIndex === null ? [] : imageSets[activeIndex] ?? []
  const selectedImage = images.length ? activeImage % images.length : 0
  const currentImage = images[selectedImage] ?? ''
  const links = project ? getProjectLinks(project) : { live: '', github: '' }
  const owner = project ? getProjectOwner(project) : ''
  const technologies = project ? getProjectStack(project) : []
  const role = projectValue(project?.['my role']).replace(/^Role:\s*/i, '')
  const overview = project
    ? projectValue(project['short description']) || projectValue(project.about)
    : ''

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (project && !dialog.open) dialog.showModal()
    else if (!project && dialog.open) dialog.close()
  }, [project])

  useEffect(() => {
    const lightbox = lightboxRef.current
    if (!lightbox) return
    if (currentImage && lightbox.dataset.requestedOpen === 'true' && !lightbox.open) {
      lightbox.showModal()
    } else if ((!currentImage || lightbox.dataset.requestedOpen !== 'true') && lightbox.open) {
      lightbox.close()
    }
  }, [currentImage])

  const moveImage = (direction) => {
    if (images.length < 2) return
    setActiveImage((current) => (current + direction + images.length) % images.length)
  }

  const moveProject = (direction) => {
    if (projects.length < 2 || activeIndex === null) return
    onNavigate((activeIndex + direction + projects.length) % projects.length)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') moveProject(-1)
    if (event.key === 'ArrowRight') moveProject(1)
  }

  return (
    <>
      <dialog
        className="project-dialog"
        ref={dialogRef}
        aria-labelledby="project-dialog-title"
        onClose={() => {
          lightboxRef.current?.close()
          onClose()
        }}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        {project && (
          <div className="case-study">
            <header className="case-study-header">
              <p className="gallery-eyebrow">Project case study</p>
              <button
                className="dialog-close"
                type="button"
                aria-label="Close project details"
                onClick={() => dialogRef.current?.close()}
              >
                ×
              </button>
            </header>

            <div className="case-study-columns">
              <section className="case-study-visuals" aria-label={`${project.project} screenshots`}>
                <div className="case-study-main-image">
                  {currentImage ? (
                    <button
                      className="case-study-image-button"
                      type="button"
                      aria-label="Open screenshot in enlarged view"
                      onClick={() => {
                        if (!lightboxRef.current) return
                        lightboxRef.current.dataset.requestedOpen = 'true'
                        lightboxRef.current.showModal()
                      }}
                    >
                      <ProjectImage
                        src={currentImage}
                        projectName={project.project}
                        projectType={project.type}
                        icon={project.icon}
                      />
                      <span className="image-zoom-hint">Enlarge image</span>
                    </button>
                  ) : (
                    <ProjectImage
                      src=""
                      projectName={project.project}
                      projectType={project.type}
                      icon={project.icon}
                      description={overview}
                    />
                  )}
                  {images.length > 1 && (
                    <>
                      <button className="image-arrow previous" type="button" aria-label="Previous screenshot" onClick={() => moveImage(-1)}>‹</button>
                      <button className="image-arrow next" type="button" aria-label="Next screenshot" onClick={() => moveImage(1)}>›</button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="screenshot-navigation">
                    <div className="screenshot-thumbnails" aria-label="Choose screenshot">
                      {images.map((image, index) => (
                        <button
                          className={`screenshot-thumbnail${index === selectedImage ? ' active' : ''}`}
                          key={image}
                          type="button"
                          aria-label={`Show screenshot ${index + 1}`}
                          aria-pressed={index === selectedImage}
                          onClick={() => setActiveImage(index)}
                        >
                          <img src={image} alt="" />
                        </button>
                      ))}
                    </div>
                    <span>{selectedImage + 1} / {images.length}</span>
                  </div>
                )}
              </section>

              <section className="case-study-details">
                <p className="case-study-type">{project.type}</p>
                <h2 id="project-dialog-title">{project.project}</h2>

                <div className="case-study-ownership">
                  <ProjectStatus status={project.status} />
                  {owner && <span>{owner}</span>}
                </div>

                {overview && (
                  <section className="case-study-section">
                    <h3>Overview</h3>
                    <p>{overview}</p>
                  </section>
                )}

                {role && (
                  <section className="case-study-section">
                    <h3>My role</h3>
                    <p>{role}</p>
                  </section>
                )}

                {project.roleDetails && (
                  <section className="case-study-section rich-project-details">
                    <h3>Responsibilities &amp; contributions</h3>
                    <div dangerouslySetInnerHTML={{ __html: project.roleDetails }} />
                  </section>
                )}

                {technologies.length > 0 && (
                  <section className="case-study-section">
                    <h3>Technology</h3>
                    <ul className="technology-tags full-stack">
                      {technologies.map((technology) => <li key={technology}>{technology}</li>)}
                    </ul>
                  </section>
                )}

                {(links.live || links.github) && (
                  <nav className="case-study-links" aria-label="Project links">
                    <ProjectLink href={links.live}>Live Demo</ProjectLink>
                    <ProjectLink href={links.github}>GitHub</ProjectLink>
                  </nav>
                )}
              </section>
            </div>

            <footer className="case-study-footer">
              <button type="button" onClick={() => moveProject(-1)} disabled={projects.length < 2}>
                <span aria-hidden="true">←</span> Previous project
              </button>
              <span>{activeIndex + 1} / {projects.length}</span>
              <button type="button" onClick={() => moveProject(1)} disabled={projects.length < 2}>
                Next project <span aria-hidden="true">→</span>
              </button>
            </footer>
          </div>
        )}
      </dialog>

      <dialog
        className="project-lightbox"
        ref={lightboxRef}
        aria-label={`${project?.project ?? 'Project'} enlarged screenshot`}
        onClose={() => {
          if (lightboxRef.current) lightboxRef.current.dataset.requestedOpen = 'false'
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <button className="dialog-close" type="button" aria-label="Close enlarged screenshot" onClick={() => lightboxRef.current?.close()}>×</button>
        {currentImage && <img src={currentImage} alt={`${project?.project ?? 'Project'} screenshot`} />}
      </dialog>
    </>
  )
}

export default ProjectDetailDialog