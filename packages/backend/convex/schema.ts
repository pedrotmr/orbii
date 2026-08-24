import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clientUserId: v.string(),
    capacity: v.number(),
    timezone: v.string(),
    streak: v.number(),
    daysCompleted: v.number(),
    lastCompletedLocalDate: v.union(v.string(), v.null()),
  }).index("by_clientUserId", ["clientUserId"]),

  habits: defineTable({
    clientUserId: v.string(),
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
    .index("by_clientUserId", ["clientUserId"])
    .index("by_clientUserId_habitKey", ["clientUserId", "habitKey"]),

  daySessions: defineTable({
    clientUserId: v.string(),
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
  }).index("by_clientUserId_localDate", ["clientUserId", "localDate"]),
});
