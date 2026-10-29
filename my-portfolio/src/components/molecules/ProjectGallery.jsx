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

const galleryProjects = projects.filter(
  (project) => project.type?.trim().toLowerCase() === 'personal project',
)

const imageByName = Object.fromEntries(
  Object.entries(screenshotFiles).map(([path, url]) => [
    path.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    url,
  ]),
)

const projectImages = galleryProjects.map((project) => resolveProjectImages(project, imageByName))

function ProjectGallery({ embedded = false }) {
  const [activeIndex, setActiveIndex] = useState(null)

  return (
    <section
      className={`gallery-wall${embedded ? ' embedded' : ''}`}
      id="projects"
      aria-labelledby="gallery-title"
    >
      <div className="gallery-wall-inner">
        <header className="gallery-wall-heading">
          <p className="gallery-eyebrow">Selected work</p>
          <h1 id="gallery-title">A collection of things made</h1>
          <p>Independent projects and work built with thoughtful teams.</p>
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