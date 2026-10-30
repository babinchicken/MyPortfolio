function ProjectImage({ src, projectName, projectType, icon, description, className = '' }) {
  if (src) {
    return <img className={className} src={src} alt={`${projectName} screenshot`} />
  }

  return (
    <div className={`project-artwork-fallback ${className}`}>
      <span className="project-artwork-type">{projectType}</span>
      {icon && <span className="project-artwork-icon" aria-hidden="true">{icon.slice(0, 2).toUpperCase()}</span>}
      <strong>{projectName}</strong>
      {description && <span className="project-artwork-description">{description}</span>}
    </div>
  )
}

export default ProjectImage