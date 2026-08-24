import { motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";
import "./MetricIcons.css";

type MetricProps = {
  value: string | number;
  label: string;
  children: ReactNode;
};

export function MetricIcon({ value, label, children }: MetricProps) {
  return (
    <div className="metric-icon">
      <div className="metric-icon__glyph" aria-hidden>
        {children}
      </div>
      <p className="metric-icon__value">{value}</p>
      <p className="metric-icon__label">{label}</p>
    </div>
  );
}

export function MetricRow({ children }: { children: ReactNode }) {
  return <div className="metric-row">{children}</div>;
}

export function FireIcon({ active = true }: { active?: boolean }) {
  const reduce = useReducedMotion();
  const live = active && !reduce;
  const uid = useId().replace(/:/g, "");
  const grad = `fireGrad-${uid}`;
  const core = `fireCore-${uid}`;

  return (
    <svg
      className={`fire-icon${active ? " fire-icon--live" : ""}`}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      fill="none"
      aria-hidden
    >
      <motion.g
        style={{ transformOrigin: "24px 40px" }}
        animate={
          live
            ? {
                scaleY: [1, 1.08, 0.96, 1.05, 1],
                scaleX: [1, 0.96, 1.04, 0.98, 1],
              }
            : undefined
        }
        transition={
          live
            ? { duration: 1.1, ease: "easeInOut", repeat: Infinity }
            : undefined
        }
      >
        <path
          d="M24 42c8.5 0 14-5.2 14-13.2C38 20 31 16.5 28.5 10c0 0-1.8 4.8-5.2 7.2C22 8 16.5 5 14 5c1.8 5.5-1 10.5-4 14.2C6.5 23.5 6 28.5 6 31.5 6 38.2 12.2 42 24 42Z"
          fill={`url(#${grad})`}
        />
      </motion.g>
      <motion.g
        style={{ transformOrigin: "24px 38px" }}
        animate={
          live
            ? {
                scale: [1, 1.1, 0.95, 1.06, 1],
                opacity: [0.9, 1, 0.85, 1, 0.9],
              }
            : undefined
        }
        transition={
          live
            ? { duration: 0.85, ease: "easeInOut", repeat: Infinity }
            : undefined
        }
      >
        <path
          d="M24 42c4.8 0 8-2.8 8-7.2 0-4.2-3.2-6.2-5.2-9.8 0 0-1 2.4-2.8 3.6C23.2 24 20.5 22.5 19 22.5c.8 2.8-.2 5.2-1.8 7.2C15.5 32 15.2 34.5 15.2 36 15.2 39.5 18.8 42 24 42Z"
          fill={`url(#${core})`}
        />
      </motion.g>
      <defs>
        <linearGradient
          id={grad}
          x1="14"
          y1="8"
          x2="34"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="oklch(0.78 0.18 55)" />
          <stop offset="0.55" stopColor="oklch(0.65 0.2 38)" />
          <stop offset="1" stopColor="oklch(0.52 0.18 28)" />
        </linearGradient>
        <linearGradient
          id={core}
          x1="20"
          y1="24"
          x2="28"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="oklch(0.95 0.08 95)" />
          <stop offset="1" stopColor="oklch(0.82 0.14 70)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OrbitCountIcon() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="15"
        stroke="oklch(0.7 0.05 38 / 0.55)"
        strokeWidth="1.5"
      />
      <motion.g
        animate={reduce ? undefined : { rotate: 360 }}
        transition={
          reduce
            ? undefined
            : { duration: 12, ease: "linear", repeat: Infinity }
        }
        style={{ transformOrigin: "24px 24px" }}
      >
        <circle
          cx="24"
          cy="24"
          r="9"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />
        <circle cx="33" cy="24" r="2.25" fill="var(--accent)" />
      </motion.g>
      <circle cx="24" cy="24" r="4" fill="var(--primary)" />
    </svg>
  );
}

export function CapacityIcon({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="15"
        stroke="var(--line-strong)"
        strokeWidth="1.5"
      />
      {Array.from({ length: Math.min(n, 5) }).map((_, i) => {
        const angle = -90 + (360 / Math.max(n, 1)) * i;
        const rad = (angle * Math.PI) / 180;
        const x = 24 + Math.cos(rad) * 10;
        const y = 24 + Math.sin(rad) * 10;
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--primary)" />;
      })}
    </svg>
  );
}

export function DaysIcon() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden>
      <rect
        x="10"
        y="12"
        width="28"
        height="26"
        rx="6"
        stroke="var(--accent)"
        strokeWidth="1.75"
      />
      <path d="M10 20h28" stroke="var(--accent)" strokeWidth="1.75" />
      <circle cx="19" cy="28" r="2.25" fill="var(--primary)" />
      <circle cx="29" cy="28" r="2.25" fill="var(--primary)" />
      <path
        d="M17 9v5M31 9v5"
        stroke="var(--ink-soft)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
