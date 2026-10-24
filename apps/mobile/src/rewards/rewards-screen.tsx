import { api } from "@orbii/backend";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { Alert } from "react-native";
import type { ActiveReward, RewardDraft } from "./rewards-types";
import BootSpinner from "../components/boot-spinner";
import ScreenScaffold from "../components/layout/screen-scaffold";
import InlineError from "../components/states/inline-error";
import RewardsActiveList from "./rewards-screen/active/rewards-active-list";
import RewardsRedeemedList from "./rewards-screen/redeemed/rewards-redeemed-list";
import RewardForm from "./rewards-screen/reward-form";
import RewardsBalance from "./rewards-screen/rewards-balance";
import { formatPoints } from "./rewards-utils";

const PAGE_SIZE = 20;

export default function RewardsScreen() {
  const user = useQuery(api.users.get, {});
  const { results, status, loadMore } = usePaginatedQuery(
    api.rewards.list,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const {
    results: redeemedRewards,
    status: redeemedStatus,
    loadMore: loadMoreRedeemed,
  } = usePaginatedQuery(
    api.rewards.listRedeemed,
    {},
    { initialNumItems: PAGE_SIZE },
  );
  const createReward = useMutation(api.rewards.create);
  const updateReward = useMutation(api.rewards.update);
  const deleteReward = useMutation(api.rewards.deleteReward);
  const redeemReward = useMutation(api.rewards.redeem);
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

  const handleAdd = () => {
    setError(null);
    setDraft({ name: "", cost: "" });
  };

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
      `Delete “${reward.name}”?`,
      "This can’t be undone. Your point balance stays the same.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete reward",
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

  const handleRedeem = (reward: ActiveReward) => {
    const balanceAfterRedemption = user.pointsBalance - reward.cost;

    Alert.alert(
      `Redeem “${reward.name}”?`,
      `Spend ${reward.cost.toLocaleString()} of your ${formatPoints(user.pointsBalance)}? You’ll have ${formatPoints(balanceAfterRedemption)} left. This can’t be undone.`,
      [
        { text: "Keep saving", style: "cancel" },
        {
          text: "Redeem",
          onPress: () => {
            void run(async () => {
              await redeemReward({ rewardId: reward.id });
            });
          },
        },
      ],
    );
  };

  return (
    <ScreenScaffold tabbed>
      <RewardsBalance balance={user.pointsBalance} />
      {error && !draft ? <InlineError message={error} /> : null}
      <RewardsActiveList
        rewards={results}
        canLoadMore={status === "CanLoadMore"}
        busy={busy}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRedeem={handleRedeem}
        onLoadMore={() => loadMore(PAGE_SIZE)}
      />
      <RewardsRedeemedList
        rewards={redeemedRewards}
        status={redeemedStatus}
        busy={busy}
        onLoadMore={() => loadMoreRedeemed(PAGE_SIZE)}
      />
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
