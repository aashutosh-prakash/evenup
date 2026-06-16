import { avatarColor, initials } from '../lib/avatar.js'

// A colored circle with the person's initials. `size` is 'sm' or 'md'.
export default function Avatar({ person, size = 'md' }) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: avatarColor(person.id) }}
      title={person.name}
      aria-label={person.name}
    >
      {initials(person.name)}
    </span>
  )
}
