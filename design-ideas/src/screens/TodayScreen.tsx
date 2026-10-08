import { Check } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { HabitRow } from "@/components/HabitRow";
import type { Habit } from "@/data/habits";
import { useOrbit } from "@/state/orbitStore";
import { PrototypeSwitcher } from "./today-capacity-prototype/prototype-switcher";
import type { CapacityRevealProps } from "./today-capacity-prototype/types";
import { VariantA } from "./today-capacity-prototype/variant-a";
import { VariantB } from "./today-capacity-prototype/variant-b";
import { VariantC } from "./today-capacity-prototype/variant-c";
import "./today-capacity-prototype/prototype.css";

// Three structural variants of the capacity flow live on /today?variant=A/B/C.
const VARIANTS = [
  { key: "A", label: "Offer list", component: VariantA },
  { key: "B", label: "Count focus", component: VariantB },
  { key: "C", label: "Offer grid", component: VariantC },
] as const;

type VariantKey = (typeof VARIANTS)[number]["key"];

interface ActiveViewProps {
  variant: VariantKey;
  committedHabits: Habit[];
  completedIds: string[];
  onToggle: (habitId: string) => void;
  onRequestRereveal: () => void;
}

function ActiveView({
  variant,
  committedHabits,
  completedIds,
  onToggle,
  onRequestRereveal,
}: ActiveViewProps) {
  const completedCount = completedIds.length;
  const remaining = committedHabits.length - completedCount;

  if (variant === "B") {
    return (
      <div className="capacity-active capacity-active--count">
        <header className="capacity-active__count-header">
          <p className="eyebrow">Today’s Orbit</p>
          <span className="capacity-count-bubble capacity-count-bubble--active">
            <strong>{committedHabits.length}</strong>
            <span>today</span>
          </span>
          <h1 className="screen-title display-title">
            Just these. Just today.
          </h1>
          <p className="screen-sub">
            {remaining === 0
              ? "Your Orbit is complete."
              : `${remaining} left · finishing this set completes today.`}
          </p>
        </header>
        <button
          className="capacity-refresh-link"
          type="button"
          onClick={onRequestRereveal}
        >
          Choose a different count →
        </button>
        <div className="capacity-active__rows">
          {committedHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              done={completedIds.includes(habit.id)}
              meta={
                completedIds.includes(habit.id) ? "Done" : "Tap when finished"
              }
              onClick={() => onToggle(habit.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "C") {
    return (
      <div className="capacity-active capacity-active--grid">
        <header className="capacity-active__grid-header">
          <p className="eyebrow">Today’s Orbit · {committedHabits.length}</p>
          <h1 className="screen-title display-title">Your focus, in reach.</h1>
          <div className="capacity-active__progress" aria-live="polite">
            <span>{completedCount} complete</span>
            <span>{remaining} to go</span>
          </div>
        </header>
        <button
          className="capacity-refresh-link"
          type="button"
          onClick={onRequestRereveal}
        >
          Choose a different Orbit →
        </button>
        <div className="capacity-active__tiles">
          {committedHabits.map((habit) => {
            const done = completedIds.includes(habit.id);
            return (
              <button
                key={habit.id}
                className="capacity-active-tile"
                data-done={done ? "true" : "false"}
                type="button"
                aria-pressed={done}
                onClick={() => onToggle(habit.id)}
              >
                <span className="capacity-active-tile__glyph" aria-hidden>
                  {habit.glyph}
                </span>
                <span>{habit.name}</span>
                <span className="capacity-active-tile__check" aria-hidden>
                  {done ? <Check size={16} strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="capacity-active capacity-active--list">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Today’s Orbit</p>
          <h1 className="screen-title display-title">
            Just these. Just today.
          </h1>
          <p className="screen-sub">
            {remaining === 0
              ? "Your Orbit is complete."
              : `${remaining} left · finishing these completes today.`}
          </p>
        </div>
        <span className="chip chip--primary">
          {completedCount}/{committedHabits.length}
        </span>
      </header>
      <button
        className="capacity-refresh-link"
        type="button"
        onClick={onRequestRereveal}
      >
        Choose a different count →
      </button>
      <div className="stack capacity-active__rows">
        {committedHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            done={completedIds.includes(habit.id)}
            meta={
              completedIds.includes(habit.id) ? "Done" : "Tap when finished"
            }
            onClick={() => onToggle(habit.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function TodayScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmRereveal, setConfirmRereveal] = useState(false);
  const {
    state,
    offeredHabits,
    committedHabits,
    seedDemo,
    startReveal,
    rereveal,
    toggleSelect,
    commitToday,
    toggleComplete,
    resetDay,
  } = useOrbit();
  const requestedVariant = searchParams.get("variant");
  const currentVariant =
    VARIANTS.find((variant) => variant.key === requestedVariant) ?? VARIANTS[0];
  const selectedIds = state.selectedIds;
  const RevealVariant = currentVariant.component;

  function changeVariant(direction: -1 | 1) {
    const currentIndex = VARIANTS.findIndex(
      (variant) => variant.key === currentVariant.key,
    );
    const nextIndex =
      (currentIndex + direction + VARIANTS.length) % VARIANTS.length;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("variant", VARIANTS[nextIndex].key);
    setSearchParams(nextParams, { replace: true });
  }

  function handleVariantKey(event: KeyboardEvent<HTMLDivElement>) {
    if (
      !import.meta.env.DEV ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
    ) {
      return;
    }

    if (
      event.target instanceof HTMLElement &&
      event.target.closest("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }

    event.preventDefault();
    changeVariant(event.key === "ArrowLeft" ? -1 : 1);
  }

  function beginRereveal() {
    setConfirmRereveal(false);
    rereveal();
  }

  const revealProps: CapacityRevealProps = {
    offeredHabits,
    selectedIds,
    suggestedCount: state.capacity,
    releasedCount: state.releasedCount,
    onToggle: toggleSelect,
    onCommit: commitToday,
    onTryNewOffer: rereveal,
  };

  return (
    <div className="today-prototype-root" onKeyDownCapture={handleVariantKey}>
      {state.habits.length === 0 ? (
        <div className="screen capacity-screen capacity-empty">
          <p className="eyebrow">Daily capacity prototype</p>
          <h1 className="screen-title display-title">
            Try the new focus flow.
          </h1>
          <p className="screen-sub">
            Load a sample Orbit to explore how the usual count guides your picks
            without limiting them.
          </p>
          <div className="spacer" />
          <Button fullWidth onClick={seedDemo}>
            Load a sample Orbit
          </Button>
        </div>
      ) : null}

      {state.habits.length > 0 && state.phase === "idle" ? (
        <div className="screen capacity-screen capacity-idle">
          <header className="capacity-idle__header">
            <p className="brand-mark">
              <span className="brand-mark__orb" />
              Orbii
            </p>
            <p className="eyebrow">Today</p>
            <h1 className="screen-title display-title">
              Ready for today’s Orbit?
            </h1>
            <p className="screen-sub">
              Your usual focus is a suggestion. Choose any count that fits today
              from the offer.
            </p>
          </header>

          <div className="capacity-idle__usual">
            <span className="capacity-idle__usual-mark" aria-hidden>
              ◉
            </span>
            <span>
              <small>Your usual focus</small>
              <strong>
                {state.capacity} {state.capacity === 1 ? "habit" : "habits"}
              </strong>
            </span>
            <button type="button" onClick={() => navigate("/settings")}>
              Change
            </button>
          </div>

          <div className="spacer" />

          <div className="bottom-bar">
            <p className="capacity-idle__offer-count">
              {Math.min(state.offerSize, state.habits.length)} options · choose
              your count
            </p>
            <Button fullWidth onClick={startReveal}>
              See today’s options
            </Button>
          </div>
        </div>
      ) : null}

      {state.phase === "reveal" ? (
        <div className="screen capacity-screen" key={currentVariant.key}>
          <RevealVariant {...revealProps} />
        </div>
      ) : null}

      {state.phase === "active" ? (
        <div
          className={`screen capacity-screen capacity-active-screen capacity-active-screen--${currentVariant.key.toLowerCase()}`}
        >
          <ActiveView
            variant={currentVariant.key}
            committedHabits={committedHabits}
            completedIds={state.completedIds}
            onToggle={toggleComplete}
            onRequestRereveal={() => setConfirmRereveal(true)}
          />
          {confirmRereveal ? (
            <div
              className="capacity-confirmation"
              role="alertdialog"
              aria-labelledby="capacity-confirm-title"
            >
              <div>
                <p className="eyebrow">Choose a different Orbit</p>
                <h2 id="capacity-confirm-title">
                  Replace today’s {committedHabits.length}-habit set?
                </h2>
                <p>
                  Unfinished picks and checkmarks will be released. Any points
                  already earned stay yours.
                </p>
              </div>
              <Button fullWidth onClick={beginRereveal}>
                See a new offer
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setConfirmRereveal(false)}
              >
                Keep today’s set
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {state.phase === "complete" ? (
        <div className="screen capacity-screen capacity-complete">
          <div className="complete-burst" aria-hidden>
            <span className="complete-burst__ring" />
            <span className="complete-burst__mark">✓</span>
          </div>
          <p className="eyebrow">Today’s Orbit</p>
          <h1 className="screen-title display-title">Complete.</h1>
          <p className="screen-sub">
            {committedHabits.length}{" "}
            {committedHabits.length === 1 ? "habit" : "habits"}
            done. You chose the right amount for today.
          </p>
          <div className="spacer" />
          <Button fullWidth onClick={resetDay}>
            Preview another day
          </Button>
        </div>
      ) : null}

      {import.meta.env.DEV ? (
        <PrototypeSwitcher
          current={currentVariant.key}
          label={currentVariant.label}
          onChange={changeVariant}
        />
      ) : null}
    </div>
  );
}
