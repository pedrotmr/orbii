import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  CAPACITY,
  OFFER_SIZE,
  STARTER_HABITS,
  type Habit,
  type HabitId,
} from "@/data/habits";

export type DayPhase = "idle" | "reveal" | "active" | "complete";

type State = {
  habits: Habit[];
  capacity: number;
  offerSize: number;
  offeredIds: HabitId[];
  selectedIds: HabitId[];
  committedIds: HabitId[];
  completedIds: HabitId[];
  phase: DayPhase;
  streak: number;
  daysCompleted: number;
  lastCompletedDate: string | null;
};

type Action =
  | { type: "ADD_HABIT"; habit: Habit }
  | { type: "REMOVE_HABIT"; id: HabitId }
  | { type: "SET_CAPACITY"; capacity: number }
  | { type: "SET_OFFER_SIZE"; offerSize: number }
  | { type: "START_REVEAL" }
  | { type: "TOGGLE_SELECT"; id: HabitId }
  | { type: "COMMIT_TODAY" }
  | { type: "TOGGLE_COMPLETE"; id: HabitId }
  | { type: "RESET_DAY" }
  | { type: "SEED_DEMO" };

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickOffer(
  habits: Habit[],
  offerSize: number,
  preferIds: HabitId[] = [],
): HabitId[] {
  if (habits.length === 0) return [];
  const preferred = preferIds.filter((id) => habits.some((h) => h.id === id));
  const rest = shuffle(
    habits.map((h) => h.id).filter((id) => !preferred.includes(id)),
  );
  return [...preferred, ...rest].slice(0, Math.min(offerSize, habits.length));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const initialState: State = {
  habits: [],
  capacity: CAPACITY,
  offerSize: OFFER_SIZE,
  offeredIds: [],
  selectedIds: [],
  committedIds: [],
  completedIds: [],
  phase: "idle",
  streak: 0,
  daysCompleted: 0,
  lastCompletedDate: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SEED_DEMO":
      return {
        ...initialState,
        habits: STARTER_HABITS,
        streak: 3,
        daysCompleted: 12,
      };
    case "ADD_HABIT": {
      if (state.habits.some((h) => h.id === action.habit.id)) return state;
      return { ...state, habits: [...state.habits, action.habit] };
    }
    case "REMOVE_HABIT":
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
      };
    case "SET_CAPACITY":
      return { ...state, capacity: Math.max(1, Math.min(5, action.capacity)) };
    case "SET_OFFER_SIZE":
      return {
        ...state,
        offerSize: Math.max(2, Math.min(8, action.offerSize)),
      };
    case "START_REVEAL": {
      if (state.habits.length === 0) return state;
      const underserved = state.habits
        .map((h) => h.id)
        .filter((id) => !state.committedIds.includes(id));
      return {
        ...state,
        phase: "reveal",
        offeredIds: pickOffer(
          state.habits,
          state.offerSize,
          underserved.slice(0, 2),
        ),
        selectedIds: [],
        committedIds: [],
        completedIds: [],
      };
    }
    case "TOGGLE_SELECT": {
      if (state.phase !== "reveal") return state;
      const exists = state.selectedIds.includes(action.id);
      if (exists) {
        return {
          ...state,
          selectedIds: state.selectedIds.filter((id) => id !== action.id),
        };
      }
      if (state.selectedIds.length >= state.capacity) return state;
      return { ...state, selectedIds: [...state.selectedIds, action.id] };
    }
    case "COMMIT_TODAY": {
      if (state.selectedIds.length === 0) return state;
      return {
        ...state,
        phase: "active",
        committedIds: state.selectedIds,
        completedIds: [],
      };
    }
    case "TOGGLE_COMPLETE": {
      if (state.phase !== "active") return state;
      if (!state.committedIds.includes(action.id)) return state;
      const done = state.completedIds.includes(action.id);
      const completedIds = done
        ? state.completedIds.filter((id) => id !== action.id)
        : [...state.completedIds, action.id];
      const allDone =
        state.committedIds.length > 0 &&
        state.committedIds.every((id) => completedIds.includes(id));
      if (!allDone) {
        return { ...state, completedIds };
      }
      const today = todayKey();
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
      const alreadyCountedToday = state.lastCompletedDate === today;
      let streak = state.streak;
      if (!alreadyCountedToday) {
        streak = state.lastCompletedDate === yesterday ? state.streak + 1 : 1;
      }
      return {
        ...state,
        completedIds,
        phase: "complete",
        daysCompleted: alreadyCountedToday
          ? state.daysCompleted
          : state.daysCompleted + 1,
        streak,
        lastCompletedDate: today,
      };
    }
    case "RESET_DAY":
      return {
        ...state,
        phase: "idle",
        offeredIds: [],
        selectedIds: [],
        committedIds: [],
        completedIds: [],
      };
    default:
      return state;
  }
}

type OrbitContextValue = {
  state: State;
  habitsById: Map<HabitId, Habit>;
  offeredHabits: Habit[];
  committedHabits: Habit[];
  seedDemo: () => void;
  addHabit: (habit: Habit) => void;
  removeHabit: (id: HabitId) => void;
  setCapacity: (n: number) => void;
  setOfferSize: (n: number) => void;
  startReveal: () => void;
  toggleSelect: (id: HabitId) => void;
  commitToday: () => void;
  toggleComplete: (id: HabitId) => void;
  resetDay: () => void;
};

const OrbitContext = createContext<OrbitContextValue | null>(null);

export function OrbitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const habitsById = useMemo(
    () => new Map(state.habits.map((h) => [h.id, h])),
    [state.habits],
  );

  const offeredHabits = useMemo(
    () =>
      state.offeredIds
        .map((id) => habitsById.get(id))
        .filter((h): h is Habit => Boolean(h)),
    [state.offeredIds, habitsById],
  );

  const committedHabits = useMemo(
    () =>
      state.committedIds
        .map((id) => habitsById.get(id))
        .filter((h): h is Habit => Boolean(h)),
    [state.committedIds, habitsById],
  );

  const value = useMemo<OrbitContextValue>(
    () => ({
      state,
      habitsById,
      offeredHabits,
      committedHabits,
      seedDemo: () => dispatch({ type: "SEED_DEMO" }),
      addHabit: (habit) => dispatch({ type: "ADD_HABIT", habit }),
      removeHabit: (id) => dispatch({ type: "REMOVE_HABIT", id }),
      setCapacity: (capacity) => dispatch({ type: "SET_CAPACITY", capacity }),
      setOfferSize: (offerSize) =>
        dispatch({ type: "SET_OFFER_SIZE", offerSize }),
      startReveal: () => dispatch({ type: "START_REVEAL" }),
      toggleSelect: (id) => dispatch({ type: "TOGGLE_SELECT", id }),
      commitToday: () => dispatch({ type: "COMMIT_TODAY" }),
      toggleComplete: (id) => dispatch({ type: "TOGGLE_COMPLETE", id }),
      resetDay: () => dispatch({ type: "RESET_DAY" }),
    }),
    [state, habitsById, offeredHabits, committedHabits],
  );

  return (
    <OrbitContext.Provider value={value}>{children}</OrbitContext.Provider>
  );
}

export function useOrbit() {
  const ctx = useContext(OrbitContext);
  if (!ctx) throw new Error("useOrbit must be used within OrbitProvider");
  return ctx;
}

export function useOrbitOptional() {
  return useContext(OrbitContext);
}
