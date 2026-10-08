import { Button } from "@/components/Button";
import { HabitRow } from "@/components/HabitRow";
import type { CapacityRevealProps } from "./types";

export function VariantB({
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
    <section className="capacity-variant capacity-variant--count">
      <header className="capacity-count-header">
        <p className="eyebrow">Your day, your size</p>
        <div className="capacity-count-header__main">
          <div>
            <h1 className="screen-title display-title">Choose what fits.</h1>
            <p className="screen-sub">
              The number you choose becomes today’s Orbit.
            </p>
          </div>
          <span className="capacity-count-bubble" aria-live="polite">
            <strong>{selectedCount}</strong>
            <span>today</span>
          </span>
        </div>
      </header>

      <div className="capacity-count-compare">
        <span className="capacity-count-compare__usual">
          <span>Your usual</span>
          <strong>{suggestedCount}</strong>
        </span>
        <span className="capacity-count-compare__arrow" aria-hidden>
          →
        </span>
        <span className="capacity-count-compare__today">
          <span>Picked today</span>
          <strong>{selectedCount}</strong>
        </span>
      </div>

      {releasedCount !== null ? (
        <p className="capacity-release-note">
          Replacing your earlier {releasedCount}-habit Orbit. Pick a new count
          from this offer; any points already earned stay yours.
        </p>
      ) : null}

      <p className="capacity-variant__prompt">
        Pick any 1–{offeredHabits.length}. Your usual count is a guide.
      </p>

      <button
        className="capacity-refresh-link"
        type="button"
        onClick={onTryNewOffer}
      >
        Show a different offer →
      </button>

      <div className="capacity-count-list">
        {offeredHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            mode="select"
            selected={selectedIds.includes(habit.id)}
            onClick={() => onToggle(habit.id)}
          />
        ))}
      </div>

      <footer className="capacity-variant__footer capacity-count-footer">
        <span className="capacity-count-footer__hint">
          {selectedCount === 0
            ? "Tap the habits that fit today"
            : `${selectedCount} selected · no daily maximum`}
        </span>
        <Button fullWidth disabled={selectedCount === 0} onClick={onCommit}>
          Start with {selectedCount || "your picks"}
        </Button>
      </footer>
    </section>
  );
}
