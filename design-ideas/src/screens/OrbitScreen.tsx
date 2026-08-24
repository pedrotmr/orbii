import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { HabitRow } from "@/components/HabitRow";
import { useOrbit } from "@/state/orbitStore";

export function OrbitScreen() {
  const navigate = useNavigate();
  const { state, removeHabit } = useOrbit();

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">All habits</p>
          <h1 className="screen-title">Your Orbit</h1>
          <p className="screen-sub">
            Everything you care about stays here. Only a few come into focus each day.
          </p>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Add habits"
          onClick={() => navigate("/orbit/setup")}
        >
          <Plus size={18} />
        </button>
      </header>

      {state.habits.length === 0 ? (
        <div className="empty-panel">
          <h2>Nothing in orbit yet</h2>
          <p>Add the habits you want to keep in your life — not a daily checklist.</p>
          <Button fullWidth onClick={() => navigate("/orbit/setup")}>
            Add habits
          </Button>
        </div>
      ) : (
        <div className="stack">
          {state.habits.map((habit) => (
            <div key={habit.id} style={{ display: "flex", gap: "0.5rem", alignItems: "stretch" }}>
              <div style={{ flex: 1 }}>
                <HabitRow
                  habit={habit}
                  mode="static"
                  meta={habit.category}
                />
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${habit.name}`}
                onClick={() => removeHabit(habit.id)}
                style={{ alignSelf: "center" }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bottom-bar">
        <Button variant="secondary" fullWidth onClick={() => navigate("/orbit/setup")}>
          Edit Orbit
        </Button>
      </div>
    </div>
  );
}
