import { motion } from "framer-motion";
import type { Habit } from "@/data/habits";

type Props = {
  habit: Habit;
  index: number;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function OfferCard({
  habit,
  index,
  selected,
  disabled,
  onToggle,
}: Props) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileTap={disabled && !selected ? undefined : { scale: 0.98 }}
      className="offer-card"
      data-selected={selected ? "true" : "false"}
      onClick={onToggle}
      type="button"
      disabled={disabled && !selected}
      aria-pressed={selected}
    >
      <span className="offer-card__rank">{index + 1}</span>
      <span className="offer-card__glyph" aria-hidden>
        {habit.glyph}
      </span>
      <span className="offer-card__name">{habit.name}</span>
    </motion.button>
  );
}
