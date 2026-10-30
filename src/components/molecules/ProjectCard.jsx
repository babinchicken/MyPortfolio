import ProjectImage from '../atoms/ProjectImage'
import ProjectLink from '../atoms/ProjectLink'
import ProjectStatus from '../atoms/ProjectStatus'
import { getProjectLinks, getProjectOwner, getProjectStack, projectValue } from './projectData'

function ProjectCard({ project, image, onOpen }) {
  const links = getProjectLinks(project)
  const owner = getProjectOwner(project)
  const role = projectValue(project['my role']).replace(/^Role:\s*/i, '')
  const summary = projectValue(project['short description']) || projectValue(project.about)
  const technologies = getProjectStack(project).slice(0, 3)

  return (
    <article className="gallery-card">
      <div className="gallery-card-frame">
        <button
          className="gallery-card-open"
          type="button"
          aria-label={`View ${project.project} case study`}
          onClick={onOpen}
        >
          <div className="gallery-card-artwork">
            <ProjectImage
              src={image}
              projectName={project.project}
              projectType={project.type}
              icon={project.icon}
              description={summary}
            />
          </div>
          <div className="gallery-card-copy">
            <div className="gallery-card-title-row">
              <h2>{project.project}</h2>
              {project.icon && <span className="gallery-card-icon" aria-hidden="true">{project.icon.slice(0, 2).toUpperCase()}</span>}
            </div>
            {summary && <p className="gallery-card-summary">{summary}</p>}
            {role && <p className="gallery-card-role"><span>Role</span>{role}</p>}
            {technologies.length > 0 && (
              <ul className="technology-tags" aria-label="Key technologies">
                {technologies.map((technology) => <li key={technology}>{technology}</li>)}
              </ul>
            )}
            <div className="gallery-card-ownership">
              <ProjectStatus status={project.status} />
              {owner && <span>{owner}</span>}
            </div>
          </div>
        </button>
        {(links.live || links.github) && (
          <nav className="gallery-card-links" aria-label={`${project.project} links`}>
            <ProjectLink href={links.live}>Live Demo</ProjectLink>
            <ProjectLink href={links.github}>GitHub</ProjectLink>
          </nav>
        )}
      </div>
    </article>
  )
}

export default ProjectCard