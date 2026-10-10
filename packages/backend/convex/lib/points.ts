import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { starterHabitPointValue } from "./habits";

export const DEFAULT_HABIT_POINT_VALUE = 20;
export const MIN_HABIT_POINT_VALUE = 1;
export const MAX_HABIT_POINT_VALUE = 100;
export const COMPLETION_BONUS_POINTS = 20;

export const getHabitPointValue = (
  pointValue: number | undefined,
  habitId?: string,
) => {
  return (
    pointValue ??
    (habitId ? starterHabitPointValue(habitId) : DEFAULT_HABIT_POINT_VALUE)
  );
};

export const validateHabitPointValue = (pointValue: number) => {
  if (
    !Number.isInteger(pointValue) ||
    pointValue < MIN_HABIT_POINT_VALUE ||
    pointValue > MAX_HABIT_POINT_VALUE
  ) {
    throw new Error("Point value must be a whole number from 1 to 100");
  }

  return pointValue;
};

export const habitAwardIdempotencyKey = (
  localDate: string,
  habitId: string,
) => {
  return `habit:${localDate}:${habitId}`;
};

export const completionBonusIdempotencyKey = (localDate: string) => {
  return `completion:${localDate}`;
};

export type PointTransactionSource =
  "habit_award" | "completion_bonus" | "reward_redemption";

export interface PointTransactionInput {
  amount: number;
  sourceType: PointTransactionSource;
  sourceName: string;
  localDate: string;
  idempotencyKey: string;
}

export const insertPointTransaction = async (
  ctx: MutationCtx,
  clerkUserId: string,
  userId: Id<"users">,
  transaction: PointTransactionInput,
) => {
  const existing = await ctx.db
    .query("pointTransactions")
    .withIndex("by_clerkUserId_idempotencyKey", (q) =>
      q
        .eq("clerkUserId", clerkUserId)
        .eq("idempotencyKey", transaction.idempotencyKey),
    )
    .unique();

  if (existing) {
    return false;
  }

  await ctx.db.insert("pointTransactions", {
    clerkUserId,
    ...transaction,
  });
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  await ctx.db.patch(userId, {
    pointsBalance: (user.pointsBalance ?? 0) + transaction.amount,
  });

  return true;
};

type SessionPointAwardInput = Omit<PointTransactionInput, "sourceType"> & {
  sourceType: "habit_award" | "completion_bonus";
};

export const insertSessionPointAward = async (
  ctx: MutationCtx,
  clerkUserId: string,
  userId: Id<"users">,
  daySessionId: Id<"daySessions">,
  transaction: SessionPointAwardInput,
) => {
  if (transaction.amount <= 0) {
    throw new Error("Session point awards must be positive");
  }

  const inserted = await insertPointTransaction(
    ctx,
    clerkUserId,
    userId,
    transaction,
  );

  if (!inserted) {
    return false;
  }

  const daySession = await ctx.db.get(daySessionId);

  if (!daySession) {
    throw new Error("Day session not found");
  }

  await ctx.db.patch(daySessionId, {
    earnedPoints: (daySession.earnedPoints ?? 0) + transaction.amount,
  });

  return true;
};

export const insertCompletionBonus = (
  ctx: MutationCtx,
  clerkUserId: string,
  userId: Id<"users">,
  daySessionId: Id<"daySessions">,
  localDate: string,
) => {
  return insertSessionPointAward(ctx, clerkUserId, userId, daySessionId, {
    amount: COMPLETION_BONUS_POINTS,
    sourceType: "completion_bonus",
    sourceName: "Completion bonus",
    localDate,
    idempotencyKey: completionBonusIdempotencyKey(localDate),
  });
};
