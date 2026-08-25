import AsyncStorage from "@react-native-async-storage/async-storage";

const SLICE_STORAGE_KEY = "orbii.v1.clientUserId";

export const discardSliceClientUserId = async () => {
  await AsyncStorage.removeItem(SLICE_STORAGE_KEY);
};
