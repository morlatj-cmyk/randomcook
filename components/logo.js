export default function Logo({ size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* outer cabbage leaves */}
      <path d="M16 28c6.6 0 11-4.4 11-11 0-3-1.4-5-3.6-5.8 1-2.6-.2-5-2.6-5.8C19.7 3 17.8 4 16 6c-1.8-2-3.7-3-4.8-2.4-2.4.8-3.6 3.2-2.6 5.8C6.4 10.2 5 12.2 5 15c0 6.6 4.4 13 11 13Z" />
      {/* inner leaves */}
      <path d="M16 27c-3.4-2.2-5.4-5.6-5.4-9.4 0-2 .8-3.6 2.2-4.4" />
      <path d="M16 27c3.4-2.2 5.4-5.6 5.4-9.4 0-2-.8-3.6-2.2-4.4" />
      {/* center vein */}
      <path d="M16 25V9" />
    </svg>
  );
}
