import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "@orbii/backend";
import { type Palette, radius, space } from "@orbii/tokens";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { ActiveReward, RewardDraft } from "./rewards-types";
import BootSpinner from "../components/boot-spinner";
import GhostButton from "../components/ghost-button";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import { useTheme, useThemedStyles } from "../theme/use-theme";
import RewardCard from "./rewards-screen/reward-card";
import RewardForm from "./rewards-screen/reward-form";

export default function RewardsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const user = useQuery(api.users.get, {});
  const { results, status, loadMore } = usePaginatedQuery(
    api.rewards.list,
    {},
    { initialNumItems: 20 },
  );
  const createReward = useMutation(api.rewards.create);
  const updateReward = useMutation(api.rewards.update);
  const deleteReward = useMutation(api.rewards.deleteReward);
  const [draft, setDraft] = useState<RewardDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (operation: () => Promise<unknown>) => {
    if (busy) {
      return false;
    }

    try {
      setBusy(true);
      setError(null);
      await operation();
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined || status === "LoadingFirstPage") {
    return <BootSpinner label="Loading rewards" />;
  }

  if (user === null) {
    return (
      <ScreenScaffold tabbed>
        <InlineError message="We couldn’t load your rewards. Please reopen the app." />
      </ScreenScaffold>
    );
  }

  const handleSave = async (name: string, cost: number) => {
    const saved = await run(async () => {
      if (draft?.rewardId) {
        await updateReward({ rewardId: draft.rewardId, name, cost });
      } else {
        await createReward({ name, cost });
      }
    });

    if (saved) {
      setDraft(null);
    }
  };

  const handleEdit = (reward: ActiveReward) => {
    setError(null);
    setDraft({
      rewardId: reward.id,
      name: reward.name,
      cost: String(reward.cost),
    });
  };

  const handleDelete = (reward: ActiveReward) => {
    Alert.alert(
      "Delete active reward?",
      reward.name + " will be removed. Your point balance will stay the same.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void run(async () => {
              await deleteReward({ rewardId: reward.id });
            });
          },
        },
      ],
    );
  };

  return (
    <ScreenScaffold tabbed>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>
          A LITTLE SOMETHING TO LOOK FORWARD TO
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          Your rewards
        </Text>
        <Text style={styles.subtitle}>
          Every goal grows from the same balance.
        </Text>
      </View>
      <View style={styles.balance}>
        <View style={styles.balanceIcon}>
          <Ionicons name="wallet-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.balanceCopy}>
          <Text style={styles.balanceLabel}>
            One balance for all your goals
          </Text>
          <Text style={styles.balanceValue}>
            {user.pointsBalance.toLocaleString()} pts
          </Text>
        </View>
      </View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>Active goals</Text>
          <Text style={styles.sectionSubtitle}>
            Nothing is set aside for one reward.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add reward"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => {
            setError(null);
            setDraft({ name: "", cost: "" });
          }}
          style={({ pressed }) => [
            styles.addButton,
            pressed && !busy && styles.addPressed,
          ]}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addLabel}>Add</Text>
        </Pressable>
      </View>
      {results.length > 0 ? (
        <View style={styles.list}>
          {results.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              busy={busy}
              onEdit={() => handleEdit(reward)}
              onDelete={() => handleDelete(reward)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="gift-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet.</Text>
          <Text style={styles.emptyCopy}>
            Add a reward you’d like to work toward.
          </Text>
        </View>
      )}
      {status === "CanLoadMore" ? (
        <GhostButton
          label="Load more rewards"
          disabled={busy}
          onPress={() => loadMore(20)}
        />
      ) : null}
      {error && !draft ? <InlineError message={error} /> : null}
      <Text style={styles.note}>
        Progress for every goal uses your full spendable balance. Spending
        points will change the progress on all goals.
      </Text>
      {draft ? (
        <RewardForm
          key={draft.rewardId ?? "new-reward"}
          draft={draft}
          busy={busy}
          error={error}
          onCancel={() => {
            if (!busy) {
              setDraft(null);
              setError(null);
            }
          }}
          onSave={(name, cost) => {
            void handleSave(name, cost);
          }}
        />
      ) : null}
    </ScreenScaffold>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    heading: { gap: space[2] },
    eyebrow: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.1,
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "700",
      letterSpacing: -1,
    },
    subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
    balance: {
      minHeight: 106,
      flexDirection: "row",
      alignItems: "center",
      gap: space[4],
      padding: space[5],
      borderRadius: radius.lg,
      backgroundColor: colors.primarySoft,
    },
    balanceIcon: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.surface,
    },
    balanceCopy: { flex: 1, gap: space[1] },
    balanceLabel: { color: colors.muted, fontSize: 14, fontWeight: "500" },
    balanceValue: {
      color: colors.ink,
      fontSize: 27,
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    sectionHeading: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
    },
    sectionCopy: { flex: 1, gap: space[1] },
    sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "700" },
    sectionSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    addButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: space[1],
      paddingHorizontal: space[3],
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    addPressed: { opacity: 0.75 },
    addLabel: { color: colors.primary, fontSize: 14, fontWeight: "700" },
    list: { gap: space[3] },
    empty: {
      alignItems: "center",
      gap: space[2],
      padding: space[8],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
    },
    emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: "600" },
    emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center" },
    note: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: space[2],
    },
  });
