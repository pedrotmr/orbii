import type { MutationCtx, QueryCtx } from "../_generated/server";
import { sortHabitsByOrder } from "./habits";
import { getHabitPointValue } from "./points";

export const listHabitsForUser = async (
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
) => {
  const rows = await ctx.db
    .query("habits")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .collect();

  return sortHabitsByOrder(rows).map((row) => ({
    id: row.habitKey,
    name: row.name,
    glyph: row.glyph,
    category: row.category,
    pointValue: getHabitPointValue(row.pointValue, row.habitKey),
  }));
};
