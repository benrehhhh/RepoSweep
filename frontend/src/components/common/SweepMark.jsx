export default function SweepMark({ size = 16, className = '', title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <g
        transform="translate(4 0) rotate(-28 32 34)"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 13 V30" />
        <path d="M24.5 31.5 H39.5" strokeWidth="4.5" />
        <path d="M26 34 L19 47" strokeWidth="4" />
        <path d="M32 34 V48" strokeWidth="4" />
        <path d="M38 34 L45 47" strokeWidth="4" />
      </g>
      <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.85">
        <path d="M10 22 h6" />
        <path d="M7 31 h7" />
        <path d="M11 40 h6" />
      </g>
    </svg>
  );
}
