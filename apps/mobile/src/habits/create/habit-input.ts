import { type HabitCategory } from "@orbii/backend";

export interface HabitInput {
  name: string;
  glyph: string;
  category: HabitCategory;
}
