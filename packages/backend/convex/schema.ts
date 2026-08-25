import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    capacity: v.number(),
    timezone: v.string(),
    streak: v.number(),
    daysCompleted: v.number(),
    lastCompletedLocalDate: v.union(v.string(), v.null()),
  }).index("by_clerkUserId", ["clerkUserId"]),

  habits: defineTable({
    clerkUserId: v.string(),
    habitKey: v.string(),
    name: v.string(),
    glyph: v.string(),
    category: v.union(
      v.literal("body"),
      v.literal("mind"),
      v.literal("learn"),
      v.literal("life"),
    ),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_clerkUserId_habitKey", ["clerkUserId", "habitKey"]),

  daySessions: defineTable({
    clerkUserId: v.string(),
    localDate: v.string(),
    phase: v.union(
      v.literal("idle"),
      v.literal("reveal"),
      v.literal("active"),
      v.literal("complete"),
    ),
    offeredIds: v.array(v.string()),
    selectedIds: v.array(v.string()),
    committedIds: v.array(v.string()),
    completedIds: v.array(v.string()),
  }).index("by_clerkUserId_localDate", ["clerkUserId", "localDate"]),
});
