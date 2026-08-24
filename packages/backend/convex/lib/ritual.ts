import { clampCapacity, offerSizeFor, type Habit } from "./habits";

export type DayPhase = "idle" | "reveal" | "active" | "complete";

export type DaySession = {
  localDate: string;
  phase: DayPhase;
  offeredIds: string[];
  selectedIds: string[];
  committedIds: string[];
  completedIds: string[];
};

export type UserStats = {
  streak: number;
  daysCompleted: number;
  lastCompletedLocalDate: string | null;
};

function shuffle<T>(items: T[], random = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

/** Prefer habits not in preferLast (recently committed), then fill randomly. */
export function pickOfferIds(
  habitIds: string[],
  offerSize: number,
  underservedIds: string[] = [],
  random = Math.random,
): string[] {
  if (habitIds.length === 0 || offerSize <= 0) return [];
  const size = Math.min(offerSize, habitIds.length);
  const preferred = underservedIds.filter((id) => habitIds.includes(id));
  const rest = shuffle(
    habitIds.filter((id) => !preferred.includes(id)),
    random,
  );
  return [...preferred, ...rest].slice(0, size);
}

export function emptyDay(localDate: string): DaySession {
  return {
    localDate,
    phase: "idle",
    offeredIds: [],
    selectedIds: [],
    committedIds: [],
    completedIds: [],
  };
}

export function startReveal(
  habits: Habit[],
  capacity: number,
  previousCommittedIds: string[],
  localDate: string,
  random = Math.random,
): { session: DaySession; capacityUsed: number } {
  if (habits.length === 0) {
    throw new Error("Orbit is empty");
  }
  const capacityUsed = clampCapacity(capacity, habits.length);
  const underserved = habits
    .map((h) => h.id)
    .filter((id) => !previousCommittedIds.includes(id));
  const offeredIds = pickOfferIds(
    habits.map((h) => h.id),
    offerSizeFor(habits.length),
    underserved.slice(0, 2),
    random,
  );
  return {
    capacityUsed,
    session: {
      localDate,
      phase: "reveal",
      offeredIds,
      selectedIds: [],
      committedIds: [],
      completedIds: [],
    },
  };
}

export function toggleSelect(
  session: DaySession,
  habitId: string,
  capacity: number,
): DaySession {
  if (session.phase !== "reveal") {
    throw new Error("Can only select during reveal");
  }
  if (!session.offeredIds.includes(habitId)) {
    throw new Error("Habit not in today’s offer");
  }
  const exists = session.selectedIds.includes(habitId);
  if (exists) {
    return {
      ...session,
      selectedIds: session.selectedIds.filter((id) => id !== habitId),
    };
  }
  if (session.selectedIds.length >= capacity) {
    return session;
  }
  return { ...session, selectedIds: [...session.selectedIds, habitId] };
}

export function commit(session: DaySession): DaySession {
  if (session.phase !== "reveal") {
    throw new Error("Can only commit during reveal");
  }
  if (session.selectedIds.length === 0) {
    throw new Error("Select at least one habit");
  }
  return {
    ...session,
    phase: "active",
    committedIds: [...session.selectedIds],
    completedIds: [],
  };
}

export function toggleComplete(
  session: DaySession,
  habitId: string,
): DaySession {
  if (session.phase !== "active") {
    throw new Error("Can only complete during active");
  }
  if (!session.committedIds.includes(habitId)) {
    throw new Error("Habit not in today’s Orbit");
  }
  const done = session.completedIds.includes(habitId);
  const completedIds = done
    ? session.completedIds.filter((id) => id !== habitId)
    : [...session.completedIds, habitId];
  const allDone =
    session.committedIds.length > 0 &&
    session.committedIds.every((id) => completedIds.includes(id));
  return {
    ...session,
    completedIds,
    phase: allDone ? "complete" : "active",
  };
}

export function rereveal(
  habits: Habit[],
  capacity: number,
  session: DaySession,
  random = Math.random,
): DaySession {
  if (session.phase === "complete") {
    throw new Error("Day already complete");
  }
  if (session.phase === "idle") {
    throw new Error("Nothing to re-reveal");
  }
  const { session: next } = startReveal(
    habits,
    capacity,
    session.committedIds,
    session.localDate,
    random,
  );
  return next;
}

/** Previous local calendar date as YYYY-MM-DD (UTC date math on the string’s Y-M-D). */
export function previousLocalDate(localDate: string): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Apply streak rule B after a day becomes complete.
 * - At most one completion credit per localDate
 * - If last completed was yesterday → streak+1; else streak = 1
 */
export function applyCompletionStats(
  stats: UserStats,
  localDate: string,
): UserStats {
  if (stats.lastCompletedLocalDate === localDate) {
    return stats;
  }
  const yesterday = previousLocalDate(localDate);
  const streak =
    stats.lastCompletedLocalDate === yesterday ? stats.streak + 1 : 1;
  return {
    streak,
    daysCompleted: stats.daysCompleted + 1,
    lastCompletedLocalDate: localDate,
  };
}

/**
 * When opening a new local date, if the previous calendar day was not completed,
 * streak is broken (set to 0) until the next completion.
 */
export function applyMissedDayGap(
  stats: UserStats,
  todayLocalDate: string,
): UserStats {
  if (!stats.lastCompletedLocalDate) {
    return stats.streak === 0 ? stats : { ...stats, streak: 0 };
  }
  if (stats.lastCompletedLocalDate === todayLocalDate) {
    return stats;
  }
  const yesterday = previousLocalDate(todayLocalDate);
  if (stats.lastCompletedLocalDate === yesterday) {
    return stats;
  }
  // Gap of more than one day (or last completed is in the future — ignore)
  if (stats.lastCompletedLocalDate < yesterday) {
    return { ...stats, streak: 0 };
  }
  return stats;
}
