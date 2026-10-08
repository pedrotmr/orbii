import type { Habit } from "@/data/habits";

export interface CapacityRevealProps {
  offeredHabits: Habit[];
  selectedIds: string[];
  suggestedCount: number;
  releasedCount: number | null;
  onToggle: (habitId: string) => void;
  onCommit: () => void;
  onTryNewOffer: () => void;
}
