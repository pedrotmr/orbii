import { describe, expect, test } from "vitest";
import {
  DEFAULT_CAPACITY,
  OFFER_SIZE,
  clampCapacity,
  offerSizeFor,
  type Habit,
} from "../convex/lib/habits";
import {
  applyCompletionStats,
  applyMissedDayGap,
  commit,
  emptyDay,
  pickOfferIds,
  previousLocalDate,
  rereveal,
  startReveal,
  toggleComplete,
  toggleSelect,
  scrubHabitFromSession,
} from "../convex/lib/ritual";

const habits: Habit[] = [
  { id: "a", name: "A", glyph: "A", category: "body" },
  { id: "b", name: "B", glyph: "B", category: "mind" },
  { id: "c", name: "C", glyph: "C", category: "learn" },
  { id: "d", name: "D", glyph: "D", category: "life" },
  { id: "e", name: "E", glyph: "E", category: "body" },
  { id: "f", name: "F", glyph: "F", category: "mind" },
];

describe("capacity and offer", () => {
  test("clamps capacity to orbit size and 1–5", () => {
    expect(clampCapacity(2, 8)).toBe(2);
    expect(clampCapacity(9, 8)).toBe(5);
    expect(clampCapacity(5, 3)).toBe(3);
    expect(clampCapacity(0, 8)).toBe(1);
  });

  test("offer size is min(5, orbit)", () => {
    expect(offerSizeFor(8)).toBe(OFFER_SIZE);
    expect(offerSizeFor(3)).toBe(3);
  });
});

describe("daily ritual", () => {
  test("happy path idle → reveal → commit → complete", () => {
    const { session: revealed, capacityUsed } = startReveal(
      habits,
      DEFAULT_CAPACITY,
      [],
      "2026-08-24",
      () => 0.1,
    );
    expect(capacityUsed).toBe(2);
    expect(revealed.phase).toBe("reveal");
    expect(revealed.offeredIds).toHaveLength(5);

    let session = toggleSelect(revealed, revealed.offeredIds[0]!, 2);
    session = toggleSelect(session, revealed.offeredIds[1]!, 2);
    expect(session.selectedIds).toHaveLength(2);

    session = commit(session);
    expect(session.phase).toBe("active");

    session = toggleComplete(session, session.committedIds[0]!);
    expect(session.phase).toBe("active");
    session = toggleComplete(session, session.committedIds[1]!);
    expect(session.phase).toBe("complete");
  });

  test("cannot commit with zero selected", () => {
    const { session } = startReveal(habits, 2, [], "2026-08-24", () => 0);
    expect(() => commit(session)).toThrow(/at least one/i);
  });

  test("rereveal blocked after complete", () => {
    const { session: revealed } = startReveal(
      habits,
      2,
      [],
      "2026-08-24",
      () => 0,
    );
    let session = toggleSelect(revealed, revealed.offeredIds[0]!, 2);
    session = commit(session);
    session = toggleComplete(session, session.committedIds[0]!);
    expect(session.phase).toBe("complete");
    expect(() => rereveal(habits, 2, session, () => 0)).toThrow(/complete/i);
  });

  test("pickOffer prefers underserved ids", () => {
    const ids = pickOfferIds(["a", "b", "c", "d", "e"], 3, ["e", "d"], () => 0);
    expect(ids[0]).toBe("e");
    expect(ids[1]).toBe("d");
  });

  test("empty orbit cannot reveal", () => {
    expect(() => startReveal([], 2, [], "2026-08-24")).toThrow(/empty/i);
  });

  test("emptyDay helper", () => {
    expect(emptyDay("2026-08-24").phase).toBe("idle");
  });
});

describe("streak rule B", () => {
  test("previousLocalDate", () => {
    expect(previousLocalDate("2026-08-24")).toBe("2026-08-23");
    expect(previousLocalDate("2026-03-01")).toBe("2026-02-28");
  });

  test("first completion sets streak to 1", () => {
    const next = applyCompletionStats(
      { streak: 0, daysCompleted: 0, lastCompletedLocalDate: null },
      "2026-08-24",
    );
    expect(next).toEqual({
      streak: 1,
      daysCompleted: 1,
      lastCompletedLocalDate: "2026-08-24",
    });
  });

  test("consecutive day increments streak", () => {
    const next = applyCompletionStats(
      {
        streak: 3,
        daysCompleted: 10,
        lastCompletedLocalDate: "2026-08-23",
      },
      "2026-08-24",
    );
    expect(next.streak).toBe(4);
    expect(next.daysCompleted).toBe(11);
  });

  test("gap day resets streak to 1 on next completion", () => {
    const next = applyCompletionStats(
      {
        streak: 5,
        daysCompleted: 10,
        lastCompletedLocalDate: "2026-08-20",
      },
      "2026-08-24",
    );
    expect(next.streak).toBe(1);
  });

  test("double complete same day does not double-count", () => {
    const stats = {
      streak: 2,
      daysCompleted: 5,
      lastCompletedLocalDate: "2026-08-24",
    };
    expect(applyCompletionStats(stats, "2026-08-24")).toEqual(stats);
  });

  test("missed day gap zeroes streak until completion", () => {
    const broken = applyMissedDayGap(
      {
        streak: 4,
        daysCompleted: 8,
        lastCompletedLocalDate: "2026-08-20",
      },
      "2026-08-24",
    );
    expect(broken.streak).toBe(0);

    const stillHot = applyMissedDayGap(
      {
        streak: 4,
        daysCompleted: 8,
        lastCompletedLocalDate: "2026-08-23",
      },
      "2026-08-24",
    );
    expect(stillHot.streak).toBe(4);
  });
});

describe("scrubHabitFromSession", () => {
  test("removes committed habit and stays active when others remain", () => {
    const session = {
      localDate: "2026-08-26",
      phase: "active" as const,
      offeredIds: ["a", "b"],
      selectedIds: ["a", "b"],
      committedIds: ["a", "b"],
      completedIds: ["a"],
    };
    const next = scrubHabitFromSession(session, "a");
    expect(next.phase).toBe("active");
    expect(next.committedIds).toEqual(["b"]);
    expect(next.completedIds).toEqual([]);
  });

  test("empty active commit resets to idle", () => {
    const session = {
      localDate: "2026-08-26",
      phase: "active" as const,
      offeredIds: ["a"],
      selectedIds: ["a"],
      committedIds: ["a"],
      completedIds: [],
    };
    const next = scrubHabitFromSession(session, "a");
    expect(next.phase).toBe("idle");
    expect(next.committedIds).toEqual([]);
  });

  test("completes day when remaining committed are done", () => {
    const session = {
      localDate: "2026-08-26",
      phase: "active" as const,
      offeredIds: ["a", "b"],
      selectedIds: ["a", "b"],
      committedIds: ["a", "b"],
      completedIds: ["b"],
    };
    const next = scrubHabitFromSession(session, "a");
    expect(next.phase).toBe("complete");
    expect(next.committedIds).toEqual(["b"]);
    expect(next.completedIds).toEqual(["b"]);
  });
});
