import { type HabitCategory } from "@orbii/backend";
import { type Palette, space } from "@orbii/tokens";
import { usePreventRemove, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  completionFeedback,
  selectionFeedback,
} from "../../components/controls/feedback";
import {
  defaultHabitSymbol,
  suggestHabitSymbol,
  symbolGlyph,
  type HabitSymbol,
} from "../../components/habits/habit-symbol-catalog";
import PrimaryButton from "../../components/primary-button";
import InlineError from "../../components/states/inline-error";
import { useThemedStyles } from "../../theme/use-theme";
import HabitSheetHeader from "./chrome/habit-sheet-header";
import HabitCreateForm from "./form/habit-create-form";
import { type HabitInput } from "./habit-input";
import HabitSymbolPicker from "./picker/habit-symbol-picker";

interface HabitCreateScreenProps {
  onSave: (input: HabitInput) => Promise<unknown>;
}

export default function HabitCreateScreen({ onSave }: HabitCreateScreenProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [chosenSymbol, setChosenSymbol] = useState<HabitSymbol | null>(null);
  const [chosenCategory, setChosenCategory] = useState<HabitCategory | null>(
    null,
  );
  const [choosingIcon, setChoosingIcon] = useState(false);
  const [pendingSymbol, setPendingSymbol] =
    useState<HabitSymbol>(defaultHabitSymbol);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const suggested = suggestHabitSymbol(name);
  const symbol = chosenSymbol ?? suggested ?? defaultHabitSymbol;
  const category = chosenCategory ?? suggested?.category ?? "life";
  const dirty = Boolean(name.trim() || chosenSymbol || chosenCategory);
  const disablePrevention = usePreventRemove(
    !leaving && (dirty || busy || choosingIcon),
    ({ repeat }) => {
      if (submitting.current) {
        return;
      }

      if (choosingIcon) {
        setChoosingIcon(false);
        return;
      }

      Alert.alert(
        "Discard this habit?",
        "Your habit hasn’t been added to your Orbit yet.",
        [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setLeaving(true);
              repeat();
            },
          },
        ],
      );
    },
  );

  const close = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const save = async () => {
    if (!name.trim() || submitting.current) {
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        glyph: symbolGlyph(symbol.id),
        category,
      });
      completionFeedback();
      setLeaving(true);
      disablePrevention();
      close();
    } catch {
      setError(
        "We couldn’t add your habit. Check your connection and try again. Your draft is still here.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const openPicker = () => {
    Keyboard.dismiss();
    selectionFeedback();
    setPendingSymbol(symbol);
    setChoosingIcon(true);
  };

  const useIcon = () => {
    Keyboard.dismiss();
    setChosenSymbol(pendingSymbol);
    setChoosingIcon(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
    >
      <HabitSheetHeader
        choosingIcon={choosingIcon}
        busy={busy}
        onBack={() => setChoosingIcon(false)}
        onClose={close}
      />
      <ScrollView
        key={choosingIcon ? "picker" : "form"}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Animated.View
          entering={FadeIn.duration(140).reduceMotion(ReduceMotion.System)}
        >
          {choosingIcon ? (
            <HabitSymbolPicker
              selected={pendingSymbol}
              suggested={suggested}
              onSelect={setPendingSymbol}
            />
          ) : (
            <HabitCreateForm
              name={name}
              symbol={symbol}
              category={category}
              busy={busy}
              onNameChange={setName}
              onCategoryChange={setChosenCategory}
              onChooseIcon={openPicker}
              onSubmit={() => void save()}
            />
          )}
        </Animated.View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, space[4]) },
        ]}
      >
        {error ? <InlineError message={error} /> : null}
        {choosingIcon ? (
          <PrimaryButton label="Use icon" onPress={useIcon} />
        ) : (
          <PrimaryButton
            label={busy ? "Adding…" : "Add to Orbit"}
            disabled={busy || !name.trim()}
            onPress={() => void save()}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface },
    scroll: { flex: 1 },
    content: {
      padding: space[6],
      paddingTop: space[2],
      paddingBottom: space[6],
    },
    footer: {
      paddingHorizontal: space[6],
      paddingTop: space[3],
      gap: space[3],
      backgroundColor: colors.surface,
    },
  });
