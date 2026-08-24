import {
  DEFAULT_CAPACITY,
  EASY_STARTER_IDS,
  STARTER_HABITS,
  applyCompletionStats,
  applyMissedDayGap,
  commit as ritualCommit,
  emptyDay,
  rereveal as ritualRereveal,
  startReveal,
  toggleComplete as ritualToggleComplete,
  toggleSelect as ritualToggleSelect,
  type DaySession,
  type Habit,
  type UserStats,
} from "@orbii/backend";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "orbii.v1.slice";

export type SliceState = {
  clientUserId: string;
  capacity: number;
  habits: Habit[];
  session: DaySession;
  stats: UserStats;
};

const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const newClientUserId = () => {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const loadSlice = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const today = todayLocal();
  if (!raw) {
    return {
      clientUserId: newClientUserId(),
      capacity: DEFAULT_CAPACITY,
      habits: [] as Habit[],
      session: emptyDay(today),
      stats: {
        streak: 0,
        daysCompleted: 0,
        lastCompletedLocalDate: null,
      } satisfies UserStats,
    } satisfies SliceState;
  }
  const parsed = JSON.parse(raw) as SliceState;
  const stats = applyMissedDayGap(parsed.stats, today);
  let session = parsed.session;
  if (session.localDate !== today) {
    session = emptyDay(today);
  }
  return { ...parsed, stats, session };
};

export const saveSlice = async (state: SliceState) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const seedEasyOrbit = (state: SliceState) => {
  const habits = STARTER_HABITS.filter((h) =>
    (EASY_STARTER_IDS as readonly string[]).includes(h.id),
  );
  // Also add a couple richer ones so offer has variety
  const extra = STARTER_HABITS.filter(
    (h) => h.id === "read" || h.id === "journal",
  );
  const merged = [...habits, ...extra];
  return { ...state, habits: merged };
};

export const doStartReveal = (state: SliceState) => {
  const { session } = startReveal(
    state.habits,
    state.capacity,
    state.session.committedIds,
    todayLocal(),
  );
  return { ...state, session };
};

export const doToggleSelect = (state: SliceState, habitId: string) => {
  return {
    ...state,
    session: ritualToggleSelect(state.session, habitId, state.capacity),
  };
};

export const doCommit = (state: SliceState) => {
  return { ...state, session: ritualCommit(state.session) };
};

export const doToggleComplete = (state: SliceState, habitId: string) => {
  const before = state.session;
  const session = ritualToggleComplete(before, habitId);
  let stats = state.stats;
  if (before.phase !== "complete" && session.phase === "complete") {
    stats = applyCompletionStats(stats, session.localDate);
  }
  return { ...state, session, stats };
};

export const doRereveal = (state: SliceState) => {
  return {
    ...state,
    session: ritualRereveal(state.habits, state.capacity, state.session),
  };
};

export const setCapacity = (state: SliceState, capacity: number) => {
  return { ...state, capacity };
};

export const resetDemo = () => {
  const today = todayLocal();
  return seedEasyOrbit({
    clientUserId: newClientUserId(),
    capacity: DEFAULT_CAPACITY,
    habits: [],
    session: emptyDay(today),
    stats: { streak: 0, daysCompleted: 0, lastCompletedLocalDate: null },
  });
};
