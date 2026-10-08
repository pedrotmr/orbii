import { Check } from "lucide-react";
import { Button } from "@/components/Button";
import type { CapacityRevealProps } from "./types";

export function VariantC({
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
    <section className="capacity-variant capacity-variant--grid">
      <header className="capacity-grid-header">
        <div className="capacity-grid-header__copy">
          <p className="eyebrow">A fresh offer</p>
          <h1 className="screen-title display-title">Make room for today.</h1>
          <p className="screen-sub">
            Pick the habits you want. One is enough; all {offeredHabits.length}{" "}
            are okay too.
          </p>
        </div>
        <div className="capacity-usual-card">
          <span>Your usual</span>
          <strong>{suggestedCount}</strong>
          <small>just a guide</small>
        </div>
      </header>

      {releasedCount !== null ? (
        <p className="capacity-release-note">
          Your earlier {releasedCount}-habit Orbit was released. Any points
          already earned stay yours.
        </p>
      ) : null}

      <button
        className="capacity-refresh-link"
        type="button"
        onClick={onTryNewOffer}
      >
        Refresh the offer →
      </button>

      <div className="capacity-grid" aria-label="Today’s offered habits">
        {offeredHabits.map((habit) => {
          const selected = selectedIds.includes(habit.id);
          return (
            <button
              key={habit.id}
              type="button"
              className="capacity-tile"
              data-selected={selected ? "true" : "false"}
              aria-pressed={selected}
              onClick={() => onToggle(habit.id)}
            >
              <span className="capacity-tile__check" aria-hidden>
                {selected ? <Check size={15} strokeWidth={3} /> : null}
              </span>
              <span className="capacity-tile__glyph" aria-hidden>
                {habit.glyph}
              </span>
              <span className="capacity-tile__name">{habit.name}</span>
            </button>
          );
        })}
      </div>

      <footer className="capacity-grid-footer">
        <div className="capacity-grid-footer__summary" aria-live="polite">
          <div className="capacity-grid-footer__dots" aria-hidden>
            {offeredHabits.map((habit, index) => (
              <span
                key={habit.id}
                data-on={index < selectedCount ? "true" : "false"}
              />
            ))}
          </div>
          <span>{selectedCount} picked · your count sets today’s capacity</span>
        </div>
        <Button fullWidth disabled={selectedCount === 0} onClick={onCommit}>
          Commit today’s Orbit
        </Button>
      </footer>
    </section>
  );
}
