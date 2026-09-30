import type { OrbitLiveActivityContent } from "./orbit-live-activity-content";

export const isOrbitLiveActivitySupported = async () => false;

export const hasActiveOrbitLiveActivity = async () => false;

export const startOrbitLiveActivity = async (
  _content: OrbitLiveActivityContent,
) => false;

export const updateExistingOrbitLiveActivity = async (
  _content: OrbitLiveActivityContent,
) => false;

export const endOrbitLiveActivity = async (
  _content?: OrbitLiveActivityContent,
  _dismissalPolicy: "default" | "immediate" = "immediate",
) => false;
