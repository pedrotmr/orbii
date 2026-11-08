import { api } from "@orbii/backend";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { isLocalDateReady, useTodayLocal } from "../local-date";
import { resolveTodayHabits } from "./today-habit";

export const useOrbitDay = () => {
  const user = useQuery(api.users.get, {});
  const localDate = useTodayLocal(user?.timezone);
  const day = useQuery(api.day.get, { localDate });
  const habits = useQuery(api.habits.list, {});
  const ready =
    user !== undefined &&
    user !== null &&
    isLocalDateReady(localDate, user.timezone) &&
    day !== undefined &&
    day !== null &&
    habits !== undefined;
  const committedHabits = useMemo(() => {
    return resolveTodayHabits(
      day?.session.committedIds,
      habits,
      day?.session.committedPointValues,
      day?.session.committedHabitSnapshots,
    );
  }, [
    day?.session.committedHabitSnapshots,
    day?.session.committedIds,
    day?.session.committedPointValues,
    habits,
  ]);

  return { user, localDate, day, habits, committedHabits, ready };
};
