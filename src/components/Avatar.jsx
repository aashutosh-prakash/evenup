import { avatarColor, colorIndexForId, initials } from '../lib/avatar.js'

// A colored circle with the person's initials. `size` is 'sm' or 'md'.
export default function Avatar({ person, size = 'md' }) {
  const index = Number.isInteger(person.colorIndex)
    ? person.colorIndex
    : colorIndexForId(person.id)
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: avatarColor(index) }}
      title={person.name}
      aria-label={person.name}
    >
      {initials(person.name)}
    </span>
  )
}
