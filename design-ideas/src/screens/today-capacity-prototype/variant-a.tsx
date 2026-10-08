import { Button } from "@/components/Button";
import { OfferCard } from "@/components/OfferCard";
import type { CapacityRevealProps } from "./types";

export function VariantA({
  offeredHabits,
  selectedIds,
  suggestedCount,
  releasedCount,
  onToggle,
  onCommit,
  onTryNewOffer,
}: CapacityRevealProps) {
  const selectedCount = selectedIds.length;

  return (
    <section className="capacity-variant capacity-variant--list">
      <header className="capacity-variant__header">
        <div>
          <p className="eyebrow">Today’s offer</p>
          <h1 className="screen-title display-title">What fits today?</h1>
        </div>
        <span className="chip chip--primary">Usual · {suggestedCount}</span>
      </header>

      <p className="screen-sub">
        Your usual is a guide. Choose any 1–{offeredHabits.length} habits from
        today’s offer.
      </p>

      {releasedCount !== null ? (
        <p className="capacity-release-note">
          Your earlier {releasedCount}-habit Orbit was released. Choose a new
          set and count; any points already earned stay yours.
        </p>
      ) : null}

      <button
        className="capacity-refresh-link"
        type="button"
        onClick={onTryNewOffer}
      >
        See a different offer →
      </button>

      <div className="stack capacity-variant__list">
        {offeredHabits.map((habit, index) => (
          <OfferCard
            key={habit.id}
            habit={habit}
            index={index}
            selected={selectedIds.includes(habit.id)}
            onToggle={() => onToggle(habit.id)}
          />
        ))}
      </div>

      <footer className="capacity-variant__footer">
        <div className="capacity-list-summary">
          <span>Today’s capacity</span>
          <strong>
            {selectedCount} {selectedCount === 1 ? "habit" : "habits"}
          </strong>
        </div>
        <Button fullWidth disabled={selectedCount === 0} onClick={onCommit}>
          Commit {selectedCount || "your picks"} for today
        </Button>
      </footer>
    </section>
  );
}
