import { avatarColors, colorIndexForId, initials } from '../../lib/avatar.js'
import './Avatar.css'

// A flat, soft-tinted circle with the person's initials in a darker shade of
// the same hue. Colors are derived from the person's color index, so each
// person gets a distinct, deterministic look. `size` is 'sm' or 'md'.
export default function Avatar({ person, size = 'md' }) {
  const index = Number.isInteger(person.colorIndex)
    ? person.colorIndex
    : colorIndexForId(person.id)
  const { bg, fg } = avatarColors(index)
  return (
    <span
      className={`avatar avatar-${size}`}
      title={person.name}
      aria-label={person.name}
    >
      <svg className="avatar-svg" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="40" fill={bg} />
        <text
          className="avatar-initials"
          x="40"
          y="41"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="28"
          fill={fg}
        >
          {initials(person.name)}
        </text>
      </svg>
    </span>
  )
}
