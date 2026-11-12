function CareerProfileCard({ entry, category, onOpen }) {
  const isWork = category === 'work_experience'
  const title = isWork ? entry.job_title : entry.qualification
  const organization = isWork ? entry.company : entry.institution
  const categoryLabel = isWork ? 'Work experience' : `${category[0].toUpperCase()}${category.slice(1)}`
  const period = isWork
    ? `${entry.start_date} – ${entry.end_date}`
    : `${entry.start_year} – ${entry.end_year}`

  return (
    <article className="gallery-card career-profile-gallery-card">
      <div className="gallery-card-frame">
        <button
          className="gallery-card-open career-profile-card"
          type="button"
          aria-haspopup="dialog"
          aria-label={`View details for ${title} at ${organization}`}
          onClick={onOpen}
        >
          <div className={`gallery-card-artwork career-profile-card-artwork ${category}`}>
            <span>{categoryLabel}</span>
            <span className="career-profile-card-period">{period}</span>
          </div>
          <div className="gallery-card-copy career-profile-card-copy">
            <div className="gallery-card-title-row">
              <h3 className="career-profile-card-title">{title}</h3>
            </div>
            <p className="career-profile-card-organization">{organization}</p>
          </div>
        </button>
      </div>
    </article>
  )
}

export default CareerProfileCard
