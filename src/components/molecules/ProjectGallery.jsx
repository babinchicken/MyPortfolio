import { useState } from 'react'
import projects from '../../assets/data/portfolio_projects.json'
import ProjectDetailDialog from './ProjectDetailDialog'
import ProjectCard from './ProjectCard'
import { resolveProjectImages } from './projectData'

const screenshotFiles = import.meta.glob('../../assets/images/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
  query: '?url',
})

const imageByName = Object.fromEntries(
  Object.entries(screenshotFiles).map(([path, url]) => [
    path.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    url,
  ]),
)

function ProjectGallery({
  embedded = false,
  galleryRef,
  id = 'projects',
  title = 'A collection of personal projects',
  eyebrow = 'Selected work',
  subtitle = 'Independent projects and work built with thoughtful teams.',
  filterType = 'personal project',
}) {
  const [activeIndex, setActiveIndex] = useState(null)

  const galleryProjects = projects.filter((project) => {
    if (!filterType || filterType === 'all') return true
    return project.type?.trim().toLowerCase() === filterType.trim().toLowerCase()
  })

  const projectImages = galleryProjects.map((project) => resolveProjectImages(project, imageByName))
  const titleId = `${id}-title`

  return (
    <section
      className={`gallery-wall${embedded ? ' embedded' : ''}`}
      id={id}
      ref={galleryRef}
      aria-labelledby={titleId}
    >
      <div className="gallery-wall-inner">
        <header className="gallery-wall-heading">
          <p className="gallery-eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
          <p>{subtitle}</p>
        </header>

        <div className="gallery-grid">
          {galleryProjects.map((project, index) => (
            <ProjectCard
              key={`${project.project}-${index}`}
              project={project}
              image={projectImages[index][0] ?? ''}
              onOpen={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>

      <ProjectDetailDialog
        projects={galleryProjects}
        activeIndex={activeIndex}
        imageSets={projectImages}
        onNavigate={setActiveIndex}
        onClose={() => setActiveIndex(null)}
      />
    </section>
  )
}

export default ProjectGallery