import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  HABIT_CATEGORIES,
  MAX_HABIT_GLYPH_LENGTH,
  MAX_HABIT_NAME_LENGTH,
} from "./habits";
import { MCP_READ_SCOPE, MCP_WRITE_SCOPE } from "./remote_mcp_auth";
import {
  fingerprintMcpRequestId,
  type RemoteMcpTool,
} from "./remote_mcp_protocol";

interface RemoteMcpToolContext {
  toolName: string;
  clerkUserId: string;
  clientId: string;
  requestId: string | number;
  sessionId: string;
}

interface RegisteredRemoteMcpTool extends RemoteMcpTool {
  execute: (
    ctx: ActionCtx,
    args: Record<string, unknown>,
    context: RemoteMcpToolContext,
  ) => Promise<unknown>;
}

const objectSchema = (
  properties: Record<string, unknown> = {},
  required: string[] = [],
) => ({
  type: "object" as const,
  properties,
  ...(required.length > 0 ? { required } : {}),
  additionalProperties: false as const,
});

const stringProperty = { type: "string", minLength: 1 };

const requiredString = (args: Record<string, unknown>, key: string) => {
  const value = args[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Tool argument '${key}' must be a non-empty string`);
  }

  return value;
};

const getToday = async (ctx: ActionCtx, clerkUserId: string) => {
  return await ctx.runQuery(internal.day.getForRemoteMcp, { clerkUserId });
};

const todaySummary = async (ctx: ActionCtx, clerkUserId: string) => {
  const day = await getToday(ctx, clerkUserId);

  if (day.phase === "reveal") {
    return {
      localDate: day.localDate,
      phase: day.phase,
      offeredHabits: day.offeredHabits,
      selectedHabits: day.selectedHabits,
    };
  }

  if (day.phase === "active" || day.phase === "complete") {
    return {
      localDate: day.localDate,
      phase: day.phase,
      committedHabits: day.committedHabits,
      completedHabitIds: day.completedHabitIds,
      complete: day.complete,
    };
  }

  return { localDate: day.localDate, phase: day.phase };
};

const definitions: RegisteredRemoteMcpTool[] = [
  {
    name: "get_orbit",
    title: "Get Orbit",
    description: "List the habits saved in the user's Orbit.",
    requiredScope: MCP_READ_SCOPE,
    inputSchema: objectSchema(),
    execute: async (ctx, _args, { clerkUserId }) => {
      return await ctx.runQuery(internal.habits.listForRemoteMcp, {
        clerkUserId,
      });
    },
  },
  {
    name: "get_today",
    title: "Get today's ritual",
    description:
      "Read today's phase and offer, tentative selections, committed habits, or completion state.",
    requiredScope: MCP_READ_SCOPE,
    inputSchema: objectSchema(),
    execute: async (ctx, _args, { clerkUserId }) => {
      return await todaySummary(ctx, clerkUserId);
    },
  },
  {
    name: "start_today",
    title: "Start today's reveal",
    description: "Start today's ritual and create its reveal offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(),
    execute: async (ctx, _args, { clerkUserId }) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.startRevealForRemoteMcp, {
        clerkUserId,
        localDate: day.localDate,
      });
      return { ok: true };
    },
  },
  {
    name: "rereveal_today",
    title: "Re-reveal today's offer",
    description:
      "Replace an incomplete commitment with a fresh offer for today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(),
    execute: async (
      ctx,
      _args,
      { toolName, clerkUserId, clientId, requestId, sessionId },
    ) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.rerevealForRemoteMcp, {
        clerkUserId,
        clientId,
        requestId: await fingerprintMcpRequestId(
          sessionId,
          requestId,
          toolName,
          day.localDate,
        ),
        localDate: day.localDate,
      });
      return { ok: true };
    },
  },
  {
    name: "select_habit",
    title: "Select an offered habit",
    description: "Select one habit from today's reveal offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
    execute: async (ctx, args, { clerkUserId }) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.setSelectionForRemoteMcp, {
        clerkUserId,
        localDate: day.localDate,
        habitId: requiredString(args, "habitId"),
        selected: true,
      });
      return { ok: true };
    },
  },
  {
    name: "deselect_habit",
    title: "Deselect an offered habit",
    description: "Deselect one habit from today's reveal offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
    execute: async (ctx, args, { clerkUserId }) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.setSelectionForRemoteMcp, {
        clerkUserId,
        localDate: day.localDate,
        habitId: requiredString(args, "habitId"),
        selected: false,
      });
      return { ok: true };
    },
  },
  {
    name: "commit_today",
    title: "Commit today's Orbit",
    description: "Commit the habits selected from today's offer.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(),
    execute: async (
      ctx,
      _args,
      { toolName, clerkUserId, clientId, requestId, sessionId },
    ) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.commitForRemoteMcp, {
        clerkUserId,
        clientId,
        requestId: await fingerprintMcpRequestId(
          sessionId,
          requestId,
          toolName,
          day.localDate,
        ),
        localDate: day.localDate,
      });
      return { ok: true };
    },
  },
  {
    name: "complete_habit",
    title: "Complete a committed habit",
    description: "Mark one committed habit complete for today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
    execute: async (ctx, args, { clerkUserId }) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.setCompleteForRemoteMcp, {
        clerkUserId,
        localDate: day.localDate,
        habitId: requiredString(args, "habitId"),
        completed: true,
      });
      return { ok: true };
    },
  },
  {
    name: "uncomplete_habit",
    title: "Uncomplete a committed habit",
    description: "Mark one committed habit incomplete for today.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
    execute: async (ctx, args, { clerkUserId }) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.day.setCompleteForRemoteMcp, {
        clerkUserId,
        localDate: day.localDate,
        habitId: requiredString(args, "habitId"),
        completed: false,
      });
      return { ok: true };
    },
  },
  {
    name: "add_habit",
    title: "Add an Orbit habit",
    description:
      "Add a habit to the Orbit. Added habits become available in a future reveal.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema(
      {
        name: { ...stringProperty, maxLength: MAX_HABIT_NAME_LENGTH },
        glyph: { ...stringProperty, maxLength: MAX_HABIT_GLYPH_LENGTH },
        category: { type: "string", enum: [...HABIT_CATEGORIES] },
      },
      ["name", "glyph", "category"],
    ),
    execute: async (
      ctx,
      args,
      { clerkUserId, clientId, requestId, sessionId },
    ) => {
      const categoryInput = requiredString(args, "category");
      const category = HABIT_CATEGORIES.find(
        (value) => value === categoryInput,
      );

      if (category === undefined) {
        throw new Error("Tool argument 'category' is invalid");
      }

      await ctx.runMutation(internal.habits.addForRemoteMcp, {
        clerkUserId,
        clientId,
        requestId: await fingerprintMcpRequestId(sessionId, requestId),
        habitKey: crypto.randomUUID(),
        name: requiredString(args, "name"),
        glyph: requiredString(args, "glyph"),
        category,
        now: Date.now(),
      });
      return { ok: true };
    },
  },
  {
    name: "remove_habit",
    title: "Remove an Orbit habit",
    description:
      "Remove a habit from the Orbit. Removal immediately updates today's session.",
    requiredScope: MCP_WRITE_SCOPE,
    inputSchema: objectSchema({ habitId: stringProperty }, ["habitId"]),
    execute: async (ctx, args, { clerkUserId }) => {
      const day = await getToday(ctx, clerkUserId);
      await ctx.runMutation(internal.habits.removeForRemoteMcp, {
        clerkUserId,
        localDate: day.localDate,
        habitKey: requiredString(args, "habitId"),
      });
      return { ok: true };
    },
  },
];

export const remoteMcpTools: RemoteMcpTool[] = definitions.map(
  ({ execute: _execute, ...tool }) => tool,
);

export const executeRemoteMcpTool = async (
  ctx: ActionCtx,
  name: string,
  args: Record<string, unknown>,
  context: Omit<RemoteMcpToolContext, "toolName">,
) => {
  const tool = definitions.find((definition) => definition.name === name);

  if (!tool) {
    throw new Error("Unknown Orbii tool");
  }

  const allowed = Object.keys(tool.inputSchema.properties);
  const required = tool.inputSchema.required ?? [];

  if (Object.keys(args).some((key) => !allowed.includes(key))) {
    throw new Error("Tool arguments contain unsupported fields");
  }

  for (const key of required) {
    if (args[key] === undefined) {
      throw new Error(`Tool argument '${key}' is required`);
    }
  }

  return await tool.execute(ctx, args, { ...context, toolName: name });
};
