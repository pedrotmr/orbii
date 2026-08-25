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
import type * as lib_ritual from "../lib/ritual.js";
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
  "lib/ritual": typeof lib_ritual;
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
