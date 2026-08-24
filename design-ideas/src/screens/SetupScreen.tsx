import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { HabitRow } from "@/components/HabitRow";
import { STARTER_HABITS, type Habit } from "@/data/habits";
import { useOrbit } from "@/state/orbitStore";

export function SetupScreen() {
  const navigate = useNavigate();
  const { state, addHabit, removeHabit, seedDemo } = useOrbit();
  const [customName, setCustomName] = useState("");

  const inOrbit = new Set(state.habits.map((h) => h.id));

  function toggleStarter(habit: Habit) {
    if (inOrbit.has(habit.id)) removeHabit(habit.id);
    else addHabit(habit);
  }

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    const id = `custom-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    addHabit({ id, name, glyph: "●", category: "life" });
    setCustomName("");
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">Your Orbit</p>
          <h1 className="screen-title">
            What do you want to keep in your life?
          </h1>
          <p className="screen-sub">
            Add freely. You won’t do all of these every day — that’s the point.
          </p>
        </div>
      </header>

      <div className="stack stack-lg">
        <div className="stack">
          {STARTER_HABITS.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              mode="select"
              selected={inOrbit.has(habit.id)}
              meta={inOrbit.has(habit.id) ? "In your Orbit" : "Tap to add"}
              onClick={() => toggleStarter(habit)}
            />
          ))}
          {state.habits
            .filter((h) => !STARTER_HABITS.some((s) => s.id === h.id))
            .map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                mode="select"
                selected
                meta="Custom · tap to remove"
                onClick={() => removeHabit(habit.id)}
              />
            ))}
        </div>

        <div className="field">
          <label htmlFor="custom-habit">Add your own</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              id="custom-habit"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Call mom"
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
              }}
              style={{ flex: 1 }}
            />
            <Button
              variant="secondary"
              onClick={addCustom}
              disabled={!customName.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          {state.habits.length} in Orbit
        </p>
        <Button
          fullWidth
          disabled={state.habits.length < 2}
          onClick={() => navigate("/today")}
        >
          Continue
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            seedDemo();
            navigate("/today");
          }}
        >
          Use starter set
        </Button>
      </div>
    </div>
  );
}
