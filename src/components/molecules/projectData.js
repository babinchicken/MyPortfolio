export function projectValue(value) {
  if (typeof value !== 'string') return ''
  const cleanValue = value.trim()
  return cleanValue && !['none', 'null', 'n/a'].includes(cleanValue.toLowerCase())
    ? cleanValue
    : ''
}

export function getProjectVisibility(project) {
  const status = projectValue(project?.status).toLowerCase()
  return ['public', 'private'].includes(status) ? status : ''
}

export function getProjectOwner(project) {
  if (project?.type?.trim().toLowerCase() === 'personal project') return 'Personal'
  return projectValue(project?.company) || projectValue(project?.type)
}

export function getProjectLinks(project) {
  const live = projectValue(project?.url)
  const github = getProjectVisibility(project) === 'public'
    ? projectValue(project?.github)
    : ''

  return {
    live: /^https?:\/\//i.test(live) ? live : '',
    github: /^https?:\/\//i.test(github) ? github : '',
  }
}

export function getProjectStack(project) {
  return projectValue(project?.['Tech Stack'])
    .split(/[·,;|]/)
    .map((technology) => technology.trim())
    .filter(Boolean)
}

export function resolveProjectImages(project, imageByName) {
  const screenshots = Array.isArray(project?.screenshots) ? project.screenshots : []
  const candidates = [project?.screenshot, ...screenshots]
  const resolved = candidates.flatMap((candidate) => {
    const reference = projectValue(candidate)
    if (!reference) return []
    if (/^https?:\/\//i.test(reference)) return [reference]

    const normalized = reference.split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const match = Object.entries(imageByName).find(([name]) => name === normalized)?.[1]
    return match ? [match] : []
  })

  return [...new Set(resolved)]
}