import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "orbii.v1.clientUserId";

const newClientUserId = () => {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

/** Stable device-local identity until Clerk (#12). Survives reinstall only if restored. */
export const loadOrCreateClientUserId = async () => {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const created = newClientUserId();
  await AsyncStorage.setItem(STORAGE_KEY, created);
  return created;
};

export const rotateClientUserId = async () => {
  const created = newClientUserId();
  await AsyncStorage.setItem(STORAGE_KEY, created);
  return created;
};

export const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
