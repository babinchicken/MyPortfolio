function ProjectLink({ href, children }) {
  if (typeof href !== 'string') return null
  const cleanHref = href.trim()
  if (!/^https?:\/\//i.test(cleanHref) || /^(none|null|n\/a)$/i.test(cleanHref)) return null

  return <a href={cleanHref} target="_blank" rel="noopener noreferrer">{children}</a>
}

export default ProjectLink