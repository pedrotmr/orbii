import AsyncStorage from "@react-native-async-storage/async-storage";

const SLICE_STORAGE_KEY = "orbii.v1.clientUserId";

export const discardSliceClientUserId = async () => {
  try {
    await AsyncStorage.removeItem(SLICE_STORAGE_KEY);
  } catch {
    // Best-effort cleanup of the removed device-local identity.
  }
};
