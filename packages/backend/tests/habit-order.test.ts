import { describe, expect, test } from "vitest";
import { nextHabitOrder, sortHabitsByOrder } from "../convex/lib/habits";

interface OrderRecord {
  id: string;
  _creationTime: number;
  order?: number;
}

const ids = (records: OrderRecord[]) => {
  return records.map((record) => record.id);
};

describe("sortHabitsByOrder", () => {
  test("returns an empty list", () => {
    expect(sortHabitsByOrder([])).toEqual([]);
  });

  test("sorts fully ordered habits and preserves gaps and tied orders", () => {
    const habits: OrderRecord[] = [
      { id: "later", _creationTime: 1, order: 5 },
      { id: "first", _creationTime: 2, order: 0 },
      { id: "tie-a", _creationTime: 3, order: 5 },
      { id: "gap", _creationTime: 4, order: 9 },
    ];

    expect(ids(sortHabitsByOrder(habits))).toEqual([
      "first",
      "later",
      "tie-a",
      "gap",
    ]);
  });

  test("uses creation time when all habits are unordered", () => {
    const habits: OrderRecord[] = [
      { id: "newest", _creationTime: 3 },
      { id: "oldest", _creationTime: 1 },
      { id: "middle", _creationTime: 2 },
    ];

    expect(ids(sortHabitsByOrder(habits))).toEqual([
      "oldest",
      "middle",
      "newest",
    ]);
  });

  test("uses creation time when only some habits have an order", () => {
    const habits: OrderRecord[] = [
      { id: "newest", _creationTime: 3, order: 0 },
      { id: "oldest", _creationTime: 1 },
      { id: "middle", _creationTime: 2, order: 1 },
    ];

    expect(ids(sortHabitsByOrder(habits))).toEqual([
      "oldest",
      "middle",
      "newest",
    ]);
  });
});

describe("nextHabitOrder", () => {
  test("starts an empty Orbit at order zero", () => {
    expect(nextHabitOrder([])).toBe(0);
  });

  test("appends after unordered and partially ordered habits", () => {
    expect(nextHabitOrder([{ _creationTime: 1 }, { _creationTime: 2 }])).toBe(
      2,
    );
    expect(
      nextHabitOrder([{ _creationTime: 1, order: 4 }, { _creationTime: 2 }]),
    ).toBe(2);
  });

  test("uses the highest order when values are duplicated or gapped", () => {
    expect(
      nextHabitOrder([
        { _creationTime: 1, order: 2 },
        { _creationTime: 2, order: 2 },
        { _creationTime: 3, order: 7 },
      ]),
    ).toBe(8);
  });
});
