import * as Haptics from "expo-haptics";

export const selectionFeedback = () => {
  void Haptics.selectionAsync().catch(() => {});
};

export const completionFeedback = () => {
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success,
  ).catch(() => {});
};
