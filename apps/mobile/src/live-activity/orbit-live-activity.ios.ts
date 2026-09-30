import type { LiveActivityFactory } from "expo-widgets";
import { requireOptionalNativeModule } from "expo";
import * as Linking from "expo-linking";
import type { OrbitLiveActivityContent } from "./orbit-live-activity-content";

type OrbitLiveActivityFactory = LiveActivityFactory<OrbitLiveActivityContent>;

let factoryPromise: Promise<OrbitLiveActivityFactory | null> | undefined;

const getOrbitLiveActivityFactory = async () => {
  if (!factoryPromise) {
    if (!requireOptionalNativeModule("ExpoWidgets")) {
      factoryPromise = Promise.resolve(null);
      return await factoryPromise;
    }

    factoryPromise = import("./orbit-live-activity-widget.ios")
      .then((module) => module.default)
      .catch(() => null);
  }

  return await factoryPromise;
};

export const isOrbitLiveActivitySupported = async () => {
  return (await getOrbitLiveActivityFactory()) !== null;
};

export const hasActiveOrbitLiveActivity = async () => {
  const factory = await getOrbitLiveActivityFactory();

  if (!factory) {
    return false;
  }

  try {
    return factory.getInstances().length > 0;
  } catch {
    return false;
  }
};

export const startOrbitLiveActivity = async (
  content: OrbitLiveActivityContent,
) => {
  const factory = await getOrbitLiveActivityFactory();

  if (!factory) {
    return false;
  }

  const instances = factory.getInstances();
  const [existing, ...duplicates] = instances;

  if (existing) {
    await Promise.all([
      existing.update(content),
      ...duplicates.map((instance) => instance.end("immediate")),
    ]);
    return true;
  }

  factory.start(content, Linking.createURL("/today"));
  return true;
};

export const updateExistingOrbitLiveActivity = async (
  content: OrbitLiveActivityContent,
) => {
  const factory = await getOrbitLiveActivityFactory();

  if (!factory) {
    return false;
  }

  const instances = factory.getInstances();
  const [existing, ...duplicates] = instances;

  if (!existing) {
    return false;
  }

  await Promise.all([
    existing.update(content),
    ...duplicates.map((instance) => instance.end("immediate")),
  ]);
  return true;
};

export const endOrbitLiveActivity = async (
  content?: OrbitLiveActivityContent,
  dismissalPolicy: "default" | "immediate" = "immediate",
) => {
  const factory = await getOrbitLiveActivityFactory();

  if (!factory) {
    return false;
  }

  const instances = factory.getInstances();

  if (instances.length === 0) {
    return false;
  }

  await Promise.all(
    instances.map((instance) =>
      content
        ? instance.end(dismissalPolicy, content, new Date())
        : instance.end(dismissalPolicy),
    ),
  );
  return true;
};
