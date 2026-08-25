import { ConvexReactClient } from "convex/react";

const url = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!url) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is missing. Copy apps/mobile/.env.example to .env.local.",
  );
}

export const convex = new ConvexReactClient(url);
