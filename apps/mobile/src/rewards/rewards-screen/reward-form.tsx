import Ionicons from "@expo/vector-icons/Ionicons";
import { type Palette, radius, space } from "@orbii/tokens";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RewardDraft } from "../rewards-types";
import PrimaryButton from "../../components/primary-button";
import { useTheme, useThemedStyles } from "../../theme/use-theme";

interface RewardFormProps {
  draft: RewardDraft;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (name: string, cost: number) => void;
}

export default function RewardForm({
  draft,
  busy,
  error,
  onCancel,
  onSave,
}: RewardFormProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState(draft.name);
  const [cost, setCost] = useState(draft.cost);
  const parsedCost = Number(cost);
  const validName = name.trim().length > 0;
  const validCost = Number.isInteger(parsedCost) && parsedCost > 0;

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reward editor"
          disabled={busy}
          onPress={onCancel}
          style={styles.scrim}
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            accessibilityViewIsModal
            keyboardShouldPersistTaps="handled"
            style={styles.sheet}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.heading}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>YOUR NEXT LITTLE GOAL</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {draft.rewardId ? "Edit reward" : "Add a reward"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close reward editor"
                disabled={busy}
                onPress={onCancel}
                style={styles.close}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Reward name</Text>
              <TextInput
                accessibilityLabel="Reward name"
                autoCapitalize="sentences"
                editable={!busy}
                onChangeText={setName}
                placeholder="A slow Saturday"
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                style={styles.input}
                value={name}
                returnKeyType="next"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Point cost</Text>
              <View style={styles.costField}>
                <TextInput
                  accessibilityLabel="Point cost"
                  editable={!busy}
                  keyboardType="number-pad"
                  onChangeText={(text) => setCost(text.replace(/[^0-9]/g, ""))}
                  placeholder="200"
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.primary}
                  style={styles.costInput}
                  value={cost}
                  returnKeyType="done"
                />
                <Text style={styles.points}>points</Text>
              </View>
            </View>
            <Text style={styles.hint}>
              Use a positive whole number. Every reward shares the same balance.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!validCost && cost.length > 0 ? (
              <Text style={styles.error}>
                Enter a positive whole number of points.
              </Text>
            ) : null}
            <PrimaryButton
              label={draft.rewardId ? "Save changes" : "Add reward"}
              disabled={busy || !validName || !validCost}
              onPress={() => onSave(name.trim(), parsedCost)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: "flex-end" },
    keyboardAvoiding: { maxHeight: "90%" },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.ink,
      opacity: 0.38,
    },
    sheet: {
      flexGrow: 0,
      maxHeight: "100%",
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: colors.surface,
    },
    sheetContent: {
      gap: space[4],
      paddingHorizontal: space[6],
      paddingTop: space[3],
      paddingBottom: space[8],
    },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headingCopy: { gap: space[1] },
    eyebrow: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
    },
    title: {
      color: colors.ink,
      fontSize: 25,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    close: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.bgMid,
    },
    field: { gap: space[2] },
    label: { color: colors.ink, fontSize: 15, fontWeight: "600" },
    input: {
      minHeight: 54,
      paddingHorizontal: space[4],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bgMid,
      color: colors.ink,
      fontSize: 17,
    },
    costField: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingHorizontal: space[4],
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bgMid,
    },
    costInput: {
      flex: 1,
      minHeight: 52,
      color: colors.ink,
      fontSize: 17,
    },
    points: { color: colors.muted, fontSize: 14 },
    hint: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  });
