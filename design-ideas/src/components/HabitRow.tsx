import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { Habit } from "@/data/habits";

type Props = {
  habit: Habit;
  done?: boolean;
  selected?: boolean;
  meta?: string;
  onClick?: () => void;
  mode?: "check" | "select" | "static";
};

function RowInner({
  habit,
  done,
  selected,
  meta,
  mode,
}: Omit<Props, "onClick">) {
  return (
    <>
      <span className="habit-row__glyph" aria-hidden>
        {habit.glyph}
      </span>
      <span className="habit-row__body">
        <p className="habit-row__name">{habit.name}</p>
        {meta ? <p className="habit-row__meta">{meta}</p> : null}
      </span>
      {mode === "check" ? (
        <span className="habit-check" data-on={done ? "true" : "false"} aria-hidden>
          {done ? <Check size={14} strokeWidth={3} /> : null}
        </span>
      ) : null}
      {mode === "select" ? (
        <span className="habit-check" data-on={selected ? "true" : "false"} aria-hidden>
          {selected ? <Check size={14} strokeWidth={3} /> : null}
        </span>
      ) : null}
    </>
  );
}

export function HabitRow({
  habit,
  done,
  selected,
  meta,
  onClick,
  mode = "check",
}: Props) {
  const shared = {
    className: "habit-row",
    "data-done": done ? "true" : "false",
    "data-selected": selected ? "true" : "false",
  };

  if (!onClick) {
    return (
      <div {...shared} role="group">
        <RowInner habit={habit} done={done} selected={selected} meta={meta} mode={mode} />
      </div>
    );
  }

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.985 }}
      {...shared}
      onClick={onClick}
      type="button"
      aria-label={
        mode === "check"
          ? `${habit.name}${done ? ", completed" : ""}`
          : mode === "select"
            ? `${habit.name}${selected ? ", selected" : ""}`
            : habit.name
      }
    >
      <RowInner habit={habit} done={done} selected={selected} meta={meta} mode={mode} />
    </motion.button>
  );
}
