function ProjectStatus({ status }) {
  const visibility = typeof status === 'string' ? status.trim().toLowerCase() : ''
  const knownVisibility = ['public', 'private'].includes(visibility)

  return (
    <span className={`project-status ${knownVisibility ? visibility : 'unspecified'}`}>
      {knownVisibility ? visibility.toUpperCase() : 'UNSPECIFIED'}
    </span>
  )
}

export default ProjectStatus