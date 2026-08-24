import { motion, useReducedMotion } from "framer-motion";
import "./OrbitHero.css";

const SATELLITES = [
  { angle: 18, size: 0.72, color: "var(--accent)", delay: 0 },
  { angle: 128, size: 0.55, color: "var(--primary)", delay: 0.4 },
  { angle: 220, size: 0.48, color: "var(--muted-soft)", delay: 0.8 },
  { angle: 300, size: 0.62, color: "oklch(0.7 0.08 155)", delay: 1.1 },
];

export function OrbitHero() {
  const reduce = useReducedMotion();

  return (
    <div className="orbit-hero" aria-hidden>
      <div className="orbit-hero__glow" />
      <motion.div
        className="orbit-hero__ring orbit-hero__ring--outer"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={
          reduce
            ? undefined
            : { duration: 48, ease: "linear", repeat: Infinity }
        }
      >
        {SATELLITES.map((s) => (
          <span
            key={s.angle}
            className="orbit-hero__sat"
            style={{
              ["--a" as string]: `${s.angle}deg`,
              ["--s" as string]: String(s.size),
              background: s.color,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </motion.div>
      <motion.div
        className="orbit-hero__ring orbit-hero__ring--mid"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={
          reduce
            ? undefined
            : { duration: 32, ease: "linear", repeat: Infinity }
        }
      />
      <motion.div
        className="orbit-hero__core"
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.04, 1],
                boxShadow: [
                  "0 0 0 0 oklch(0.64 0.175 38 / 0.0)",
                  "0 0 0 18px oklch(0.64 0.175 38 / 0.12)",
                  "0 0 0 0 oklch(0.64 0.175 38 / 0.0)",
                ],
              }
        }
        transition={
          reduce
            ? undefined
            : { duration: 3.2, ease: "easeInOut", repeat: Infinity }
        }
      />
      <span className="orbit-hero__focus" />
    </div>
  );
}
