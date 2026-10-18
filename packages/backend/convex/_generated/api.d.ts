/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as day from "../day.js";
import type * as habits from "../habits.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_habits from "../lib/habits.js";
import type * as lib_index from "../lib/index.js";
import type * as lib_points from "../lib/points.js";
import type * as lib_remote_mcp_auth from "../lib/remote-mcp-auth.js";
import type * as lib_remote_mcp_protocol from "../lib/remote-mcp-protocol.js";
import type * as lib_ritual from "../lib/ritual.js";
import type * as lib_timezone from "../lib/timezone.js";
import type * as points from "../points.js";
import type * as remoteMcp from "../remoteMcp.js";
import type * as remoteMcpActions from "../remoteMcpActions.js";
import type * as rewards from "../rewards.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  day: typeof day;
  habits: typeof habits;
  "lib/auth": typeof lib_auth;
  "lib/habits": typeof lib_habits;
  "lib/index": typeof lib_index;
  "lib/points": typeof lib_points;
  "lib/remote-mcp-auth": typeof lib_remote_mcp_auth;
  "lib/remote-mcp-protocol": typeof lib_remote_mcp_protocol;
  "lib/ritual": typeof lib_ritual;
  "lib/timezone": typeof lib_timezone;
  points: typeof points;
  remoteMcp: typeof remoteMcp;
  remoteMcpActions: typeof remoteMcpActions;
  rewards: typeof rewards;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
