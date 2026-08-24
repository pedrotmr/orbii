import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { HabitRow } from "@/components/HabitRow";
import {
  CapacityIcon,
  DaysIcon,
  FireIcon,
  MetricIcon,
  MetricRow,
  OrbitCountIcon,
} from "@/components/MetricIcons";
import { OfferCard } from "@/components/OfferCard";
import { useOrbit } from "@/state/orbitStore";

export function TodayScreen() {
  const navigate = useNavigate();
  const {
    state,
    offeredHabits,
    committedHabits,
    startReveal,
    toggleSelect,
    commitToday,
    toggleComplete,
    resetDay,
  } = useOrbit();

  if (state.habits.length === 0) {
    return (
      <div className="screen">
        <div className="empty-panel" style={{ marginTop: "20%" }}>
          <h2>Your Orbit is empty</h2>
          <p>Add habits you care about. Orbii will rotate a small focus set each day.</p>
          <Button fullWidth onClick={() => navigate("/orbit/setup")}>
            Build your Orbit
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === "idle") {
    return (
      <div className="screen">
        <header className="screen-header">
          <div>
            <p className="brand-mark">
              <span className="brand-mark__orb" />
              Orbii
            </p>
            <h1 className="screen-title display-title" style={{ marginTop: "1.25rem" }}>
              Ready for today’s Orbit?
            </h1>
            <p className="screen-sub">
              We’ll offer {Math.min(state.offerSize, state.habits.length)} options. Pick up to{" "}
              {state.capacity} you can actually do.
            </p>
          </div>
        </header>

        <MetricRow>
          <MetricIcon value={state.habits.length} label="In Orbit">
            <OrbitCountIcon />
          </MetricIcon>
          <MetricIcon value={state.streak} label="Day streak">
            <FireIcon active={state.streak > 0} />
          </MetricIcon>
          <MetricIcon value={state.capacity} label="Capacity">
            <CapacityIcon n={state.capacity} />
          </MetricIcon>
        </MetricRow>

        <div className="spacer" />

        <div className="bottom-bar">
          <Button fullWidth onClick={startReveal}>
            See today’s options
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === "reveal") {
    const atCap = state.selectedIds.length >= state.capacity;
    return (
      <div className="screen">
        <header className="screen-header">
          <div>
            <p className="eyebrow">Today’s offer</p>
            <h1 className="screen-title display-title">What can you take on?</h1>
            <p className="screen-sub">
              Pick up to {state.capacity}. Traveling, sore, low energy — just don’t choose what
              won’t work today.
            </p>
          </div>
          <span className="chip chip--primary">
            {state.selectedIds.length}/{state.capacity}
          </span>
        </header>

        <div className="stack">
          {offeredHabits.map((habit, index) => {
            const selected = state.selectedIds.includes(habit.id);
            return (
              <OfferCard
                key={habit.id}
                habit={habit}
                index={index}
                selected={selected}
                disabled={atCap}
                onToggle={() => toggleSelect(habit.id)}
              />
            );
          })}
        </div>

        <div className="bottom-bar">
          <Button
            fullWidth
            disabled={state.selectedIds.length === 0}
            onClick={commitToday}
          >
            Start today
            {state.selectedIds.length > 0 ? ` · ${state.selectedIds.length}` : ""}
          </Button>
          <Button variant="ghost" fullWidth onClick={resetDay}>
            Not now
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === "complete") {
    return (
      <div className="screen" style={{ justifyContent: "center", textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <div className="complete-burst" aria-hidden>
            <span className="complete-burst__ring" />
            <span className="complete-burst__mark">✓</span>
          </div>
          <h1 className="screen-title display-title">Today’s Orbit complete</h1>
          <p className="screen-sub" style={{ margin: "0.75rem auto 0", maxWidth: "26ch" }}>
            {committedHabits.length} habit{committedHabits.length === 1 ? "" : "s"} done. The rest
            stayed in orbit — that’s success.
          </p>
          <div style={{ marginTop: "2rem" }}>
            <MetricRow>
              <MetricIcon value={state.streak} label="Streak">
                <FireIcon />
              </MetricIcon>
              <MetricIcon value={state.daysCompleted} label="Days done">
                <DaysIcon />
              </MetricIcon>
            </MetricRow>
          </div>
        </motion.div>

        <div className="bottom-bar">
          <Button fullWidth onClick={resetDay}>
            Preview another day
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate("/orbit")}>
            View full Orbit
          </Button>
        </div>
      </div>
    );
  }

  const remaining = state.committedIds.length - state.completedIds.length;
  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="brand-mark">
            <span className="brand-mark__orb" />
            Orbii
          </p>
          <h1 className="screen-title display-title" style={{ marginTop: "1rem" }}>
            Today’s Orbit
          </h1>
          <p className="screen-sub">
            {remaining === 0
              ? "Almost there…"
              : `${remaining} left · completing these means you succeeded`}
          </p>
        </div>
      </header>

      <div className="stack" style={{ marginBottom: "auto" }}>
        <AnimatePresence mode="popLayout">
          {committedHabits.map((habit) => {
            const done = state.completedIds.includes(habit.id);
            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                done={done}
                mode="check"
                meta={done ? "Done" : "Tap when finished"}
                onClick={() => toggleComplete(habit.id)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div className="orbit-dots" style={{ margin: "1.25rem 0" }} aria-hidden>
        {state.habits.map((h) => (
          <span
            key={h.id}
            className="orbit-dot"
            data-active={state.committedIds.includes(h.id) ? "true" : undefined}
            data-dim={!state.committedIds.includes(h.id) ? "true" : undefined}
            title={h.name}
          />
        ))}
      </div>

      <div className="bottom-bar">
        <Button variant="ghost" fullWidth onClick={resetDay}>
          Restart today’s flow
        </Button>
      </div>
    </div>
  );
}
