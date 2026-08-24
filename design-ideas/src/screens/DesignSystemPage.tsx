import { Button } from "@/components/Button";
import { HabitRow } from "@/components/HabitRow";
import { OfferCard } from "@/components/OfferCard";
import { STARTER_HABITS } from "@/data/habits";
import { useState } from "react";
import { Link } from "react-router-dom";

const swatches = [
  { name: "bg", varName: "--bg" },
  { name: "bg-mid", varName: "--bg-mid" },
  { name: "bg-deep", varName: "--bg-deep" },
  { name: "surface", varName: "--surface" },
  { name: "ink", varName: "--ink" },
  { name: "muted", varName: "--muted" },
  { name: "primary", varName: "--primary" },
  { name: "primary-soft", varName: "--primary-soft" },
  { name: "accent", varName: "--accent" },
  { name: "accent-soft", varName: "--accent-soft" },
  { name: "success", varName: "--success" },
  { name: "line", varName: "--line" },
];

export function DesignSystemPage() {
  const [selected, setSelected] = useState(true);
  const [done, setDone] = useState(false);
  const sample = STARTER_HABITS[1];

  return (
    <div
      style={{
        minHeight: "100dvh",
        padding: "2rem clamp(1rem, 4vw, 3rem) 4rem",
        background:
          "radial-gradient(ellipse 80% 50% at 10% 0%, oklch(0.92 0.04 38 / 0.35), transparent 50%), var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <p className="brand-mark" style={{ marginBottom: "0.5rem" }}>
          <span className="brand-mark__orb" />
          Orbii
        </p>
        <h1 className="screen-title" style={{ fontSize: "var(--text-3xl)" }}>
          Design system
        </h1>
        <p
          className="screen-sub"
          style={{ maxWidth: "50ch", marginBottom: "2rem" }}
        >
          Cool mist atmosphere, coral commitment. Ritual list is the home
          chrome; reveal is the action state.
        </p>
        <p style={{ marginBottom: "2.5rem" }}>
          <Link
            to="/today"
            className="demo-link"
            style={{ display: "inline-block" }}
          >
            ← Back to prototype
          </Link>
        </p>

        <section className="ds-section">
          <h2>Color</h2>
          <p>
            OKLCH tokens. Primary carries warmth; surfaces stay cool and soft —
            never blank white.
          </p>
          <div className="swatch-grid">
            {swatches.map((s) => (
              <div key={s.name} className="swatch">
                <div
                  className="swatch__chip"
                  style={{ background: `var(${s.varName})` }}
                />
                <div className="swatch__meta">
                  <strong>{s.name}</strong>
                  <span style={{ color: "var(--muted)" }}>{s.varName}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ds-section">
          <h2>Typography</h2>
          <p>Outfit, fixed rem scale for product UI.</p>
          <div className="type-specimen component-lab">
            <div className="type-row">
              <span>3xl</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-3xl)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Today’s Orbit
              </p>
            </div>
            <div className="type-row">
              <span>2xl</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-2xl)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                What can you take on?
              </p>
            </div>
            <div className="type-row">
              <span>lg</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                }}
              >
                Meditate
              </p>
            </div>
            <div className="type-row">
              <span>md</span>
              <p style={{ margin: 0 }}>
                Body copy for short supporting sentences.
              </p>
            </div>
            <div className="type-row">
              <span>sm</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  color: "var(--muted)",
                }}
              >
                Completing these means you succeeded.
              </p>
            </div>
          </div>
        </section>

        <section className="ds-section">
          <h2>Buttons</h2>
          <p>
            Primary coral for commit/complete. Secondary for quieter actions.
          </p>
          <div className="component-lab" style={{ maxWidth: "24rem" }}>
            <Button fullWidth>Start today</Button>
            <Button variant="secondary" fullWidth>
              Edit Orbit
            </Button>
            <Button variant="accent" fullWidth>
              Accent action
            </Button>
            <Button variant="ghost" fullWidth>
              Not now
            </Button>
            <Button fullWidth disabled>
              Disabled
            </Button>
          </div>
        </section>

        <section className="ds-section">
          <h2>Habit row (ritual list)</h2>
          <p>Home chrome — probe A. Tap to toggle completion.</p>
          <div className="component-lab" style={{ maxWidth: "24rem" }}>
            <HabitRow
              habit={sample}
              done={done}
              mode="check"
              meta={done ? "Done" : "Tap when finished"}
              onClick={() => setDone((v) => !v)}
            />
            <HabitRow
              habit={STARTER_HABITS[2]}
              mode="select"
              selected={selected}
              meta="Selectable"
              onClick={() => setSelected((v) => !v)}
            />
          </div>
        </section>

        <section className="ds-section">
          <h2>Offer card (reveal)</h2>
          <p>
            Action state — probe D energy. Ceremonial selection before the list.
          </p>
          <div className="component-lab" style={{ maxWidth: "24rem" }}>
            {STARTER_HABITS.slice(0, 3).map((habit, i) => (
              <OfferCard
                key={habit.id}
                habit={habit}
                index={i}
                selected={i === 0}
                onToggle={() => undefined}
              />
            ))}
          </div>
        </section>

        <section className="ds-section">
          <h2>Chips & stats</h2>
          <div className="component-lab" style={{ maxWidth: "28rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className="chip">Neutral</span>
              <span className="chip chip--primary">2/2 selected</span>
              <span className="chip chip--accent">In Orbit</span>
            </div>
            <div className="stat-row">
              <div className="stat-pill">
                <p className="stat-pill__value">8</p>
                <p className="stat-pill__label">In Orbit</p>
              </div>
              <div className="stat-pill">
                <p className="stat-pill__value">3</p>
                <p className="stat-pill__label">Day streak</p>
              </div>
            </div>
          </div>
        </section>

        <section className="ds-section">
          <h2>Motion notes</h2>
          <p>
            Reveal cards stagger in (~50ms). Completion uses a short spring.
            List checks animate layout. All respect prefers-reduced-motion via
            zeroed duration tokens.
          </p>
        </section>
      </div>
    </div>
  );
}
