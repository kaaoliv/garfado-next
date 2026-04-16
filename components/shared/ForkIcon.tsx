export function ForkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 26" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true" focusable="false">
      <line x1="9" y1="1" x2="9" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="4" y1="1" x2="4" y2="8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="14" y1="1" x2="14" y2="8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M4 8 Q9 13 14 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="9" y1="15" x2="9" y2="25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="9" cy="20" r="3.2" fill="currentColor"/>
    </svg>
  )
}
