// The EvenKar mark: an "up" chevron over an equals sign ("even things up").
// Shared by the editor header and the shared-link view so they never diverge.
export default function Logo({ className = 'brand-logo' }) {
  return (
    <svg className={className} viewBox="0 0 512 512" role="img" aria-label="EvenKar logo">
      <polyline
        points="150,215 256,130 362,215"
        fill="none"
        stroke="#1c1e21"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="150" y="285" width="212" height="44" rx="22" fill="#1c1e21" />
      <rect x="150" y="357" width="212" height="44" rx="22" fill="#1c1e21" />
    </svg>
  )
}
