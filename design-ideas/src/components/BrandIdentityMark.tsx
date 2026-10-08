export type BrandDirection = "A" | "B" | "C";

interface BrandIdentityMarkProps {
  direction: BrandDirection;
  size?: number;
}

export default function BrandIdentityMark({
  direction,
  size = 64,
}: BrandIdentityMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={`identity-mark identity-mark--${direction.toLowerCase()}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {direction === "A" ? (
        <circle
          cx="32"
          cy="32"
          r="21"
          stroke="var(--mark-main, var(--primary))"
          strokeWidth="7"
          strokeDasharray="110 24"
          strokeLinecap="round"
          transform="rotate(-34 32 32)"
        />
      ) : null}
      {direction === "B" ? (
        <g>
          <circle
            cx="20"
            cy="15"
            r="5"
            fill="var(--mark-secondary, var(--accent))"
          />
          <rect
            x="14.5"
            y="24"
            width="11"
            height="29"
            rx="5.5"
            fill="var(--mark-secondary, var(--accent))"
          />
          <circle
            cx="44"
            cy="11"
            r="5"
            fill="var(--mark-main, var(--primary))"
          />
          <rect
            x="38.5"
            y="20"
            width="11"
            height="33"
            rx="5.5"
            fill="var(--mark-main, var(--primary))"
          />
        </g>
      ) : null}
      {direction === "C" ? (
        <g
          stroke="var(--mark-secondary, var(--accent))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 13H17a5 5 0 0 0-5 5v5M42 13h5a5 5 0 0 1 5 5v5M52 41v5a5 5 0 0 1-5 5h-5M22 51h-5a5 5 0 0 1-5-5v-5" />
          <rect
            x="25"
            y="25"
            width="14"
            height="14"
            rx="4"
            fill="var(--mark-main, var(--primary))"
            stroke="none"
          />
        </g>
      ) : null}
    </svg>
  );
}
