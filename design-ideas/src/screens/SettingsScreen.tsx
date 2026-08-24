import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { DaysIcon, FireIcon, MetricIcon, MetricRow } from "@/components/MetricIcons";
import { useOrbit } from "@/state/orbitStore";

export function SettingsScreen() {
  const navigate = useNavigate();
  const { state, setCapacity, setOfferSize, seedDemo, resetDay } = useOrbit();

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Prototype</p>
          <h1 className="screen-title display-title">More</h1>
          <p className="screen-sub">Tune the daily loop and jump around the system.</p>
        </div>
      </header>

      <div className="stack stack-lg">
        <MetricRow>
          <MetricIcon value={state.streak} label="Streak">
            <FireIcon active={state.streak > 0} />
          </MetricIcon>
          <MetricIcon value={state.daysCompleted} label="Days done">
            <DaysIcon />
          </MetricIcon>
        </MetricRow>

        <section className="component-lab">
          <h2 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Daily capacity</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--text-sm)" }}>
            How many habits you aim to commit to each day.
          </p>
          <div className="segmented" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="segmented__btn"
                data-on={state.capacity === n ? "true" : "false"}
                onClick={() => setCapacity(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="component-lab">
          <h2 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Offer size</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--text-sm)" }}>
            How many options appear in the reveal before you choose.
          </p>
          <div className="segmented" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                className="segmented__btn"
                data-on={state.offerSize === n ? "true" : "false"}
                onClick={() => setOfferSize(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="component-lab">
          <h2 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Demo controls</h2>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              seedDemo();
              resetDay();
              navigate("/today");
            }}
          >
            Reset demo Orbit
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate("/design-system")}>
            Open design system
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate("/")}>
            Back to welcome
          </Button>
        </section>
      </div>
    </div>
  );
}
