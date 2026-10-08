import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleHelp,
  Coins,
  Compass,
  Gift,
  Home,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PhoneFrame } from "@/components/PhoneFrame";
import "./points-rewards-prototype.css";

type VariantKey = "A" | "B" | "C";
type Page = "today" | "orbit" | "rewards" | "more" | "habit";
type Phase = "offer" | "active" | "complete";
type Difficulty = "easy" | "medium" | "hard" | "custom";

interface Habit {
  id: string;
  name: string;
  glyph: string;
  points: number;
}

interface Reward {
  id: string;
  name: string;
  cost: number;
  redeemed: boolean;
}

interface DayAward {
  habitPoints: number;
  total: number;
}

interface RewardDraft {
  name: string;
  cost: number;
}

interface PrototypeProps {
  page: Page;
  setPage: (page: Page) => void;
  phase: Phase;
  habits: Habit[];
  selectedIds: string[];
  completedIds: string[];
  balance: number;
  rewards: Reward[];
  difficulty: Difficulty;
  habitPoints: number;
  customPoints: number;
  dayAward: DayAward | null;
  onToggleSelection: (habitId: string) => void;
  onCommit: () => void;
  onCompleteHabit: (habitId: string) => void;
  onNextDay: () => void;
  onChooseDifficulty: (difficulty: Difficulty) => void;
  onChangeCustomPoints: (value: number) => void;
  onSaveReward: (draft: RewardDraft, rewardId?: string) => void;
  onDeleteReward: (rewardId: string) => void;
  onConfirmDeleteReward: (rewardId: string) => void;
  onRedeemReward: (rewardId: string) => void;
  onConfirmRedeemReward: (rewardId: string) => void;
  onEditReward: (reward: Reward) => void;
  onAddReward: () => void;
  onEditHabit: () => void;
}

const variants: { key: VariantKey; name: string }[] = [
  { key: "A", name: "Dedicated Rewards tab" },
  { key: "B", name: "More → Rewards" },
  { key: "C", name: "Rewards inside Orbit" },
];

const presetPoints: Record<Exclude<Difficulty, "custom">, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
};

const initialRewards: Reward[] = [
  { id: "quiet-saturday", name: "A slow Saturday", cost: 120, redeemed: false },
  { id: "pottery-class", name: "Pottery class", cost: 380, redeemed: false },
  {
    id: "trail-shoes",
    name: "Trail-running shoes",
    cost: 700,
    redeemed: false,
  },
  { id: "coffee-grinder", name: "Coffee grinder", cost: 160, redeemed: true },
];

const formatPoints = (value: number) => `${value.toLocaleString()} pts`;

export function PointsRewardsPrototypeScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedVariant = searchParams.get("variant");
  const variant: VariantKey =
    requestedVariant === "B" || requestedVariant === "C"
      ? requestedVariant
      : "A";
  const [page, setPage] = useState<Page>("today");
  const [phase, setPhase] = useState<Phase>("offer");
  const [balance, setBalance] = useState(245);
  const [rewards, setRewards] = useState(initialRewards);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [dayAward, setDayAward] = useState<DayAward | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [habitPoints, setHabitPoints] = useState(20);
  const [customPoints, setCustomPoints] = useState(20);
  const [rewardDraft, setRewardDraft] = useState<RewardDraft | null>(null);
  const [editingRewardId, setEditingRewardId] = useState<string | undefined>();
  const [pendingRedemption, setPendingRedemption] = useState<Reward | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<Reward | null>(null);

  const habits = useMemo<Habit[]>(
    () => [
      {
        id: "walk",
        name: "Walk by the river",
        glyph: "↗",
        points: habitPoints,
      },
      { id: "read", name: "Read a few pages", glyph: "Aa", points: 10 },
      { id: "breathe", name: "Take a quiet pause", glyph: "◌", points: 30 },
      { id: "stretch", name: "Stretch after lunch", glyph: "⌁", points: 20 },
      { id: "plants", name: "Water the plants", glyph: "❋", points: 10 },
    ],
    [habitPoints],
  );

  useEffect(() => {
    setPage("today");
    setPhase("offer");
    setSelectedIds([]);
    setCompletedIds([]);
    setDayAward(null);
  }, [variant]);

  const changeVariant = useCallback(
    (nextVariant: VariantKey) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("variant", nextVariant);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleSelection = (habitId: string) => {
    setSelectedIds((current) => {
      if (current.includes(habitId)) {
        return current.filter((id) => id !== habitId);
      }

      return [...current, habitId];
    });
  };

  const commit = () => {
    if (selectedIds.length > 0) {
      setPhase("active");
    }
  };

  const completeHabit = (habitId: string) => {
    if (completedIds.includes(habitId)) {
      return;
    }

    const nextCompletedIds = [...completedIds, habitId];
    setCompletedIds(nextCompletedIds);

    if (nextCompletedIds.length === selectedIds.length) {
      const habitPointTotal = habits
        .filter((habit) => selectedIds.includes(habit.id))
        .reduce((total, habit) => total + habit.points, 0);
      const total = habitPointTotal + 20;
      setBalance((current) => current + total);
      setDayAward({ habitPoints: habitPointTotal, total });
      setPhase("complete");
    }
  };

  const nextDay = () => {
    setSelectedIds([]);
    setCompletedIds([]);
    setDayAward(null);
    setPhase("offer");
    setPage("today");
  };

  const chooseDifficulty = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);

    if (nextDifficulty !== "custom") {
      setHabitPoints(presetPoints[nextDifficulty]);
    }
  };

  const changeCustomPoints = (value: number) => {
    const clampedValue = Math.max(1, Math.min(100, Math.round(value) || 1));
    setCustomPoints(clampedValue);
    setHabitPoints(clampedValue);
  };

  const openNewReward = () => {
    setEditingRewardId(undefined);
    setRewardDraft({ name: "", cost: 200 });
  };

  const openRewardEditor = (reward: Reward) => {
    setEditingRewardId(reward.id);
    setRewardDraft({ name: reward.name, cost: reward.cost });
  };

  const saveReward = (draft: RewardDraft, rewardId?: string) => {
    if (rewardId) {
      setRewards((current) =>
        current.map((reward) =>
          reward.id === rewardId
            ? { ...reward, name: draft.name.trim(), cost: draft.cost }
            : reward,
        ),
      );
    } else {
      setRewards((current) => [
        ...current,
        {
          id: `reward-${Date.now()}`,
          name: draft.name.trim(),
          cost: draft.cost,
          redeemed: false,
        },
      ]);
    }

    setRewardDraft(null);
  };

  const deleteReward = (rewardId: string) => {
    setRewards((current) => current.filter((reward) => reward.id !== rewardId));
    setPendingDelete(null);
  };

  const redeemReward = (rewardId: string) => {
    const reward = rewards.find((item) => item.id === rewardId);
    if (!reward || reward.redeemed || balance < reward.cost) {
      setPendingRedemption(null);
      return;
    }

    setBalance((current) => current - reward.cost);
    setRewards((current) =>
      current.map((item) =>
        item.id === rewardId ? { ...item, redeemed: true } : item,
      ),
    );
    setPendingRedemption(null);
  };

  const props: PrototypeProps = {
    page,
    setPage,
    phase,
    habits,
    selectedIds,
    completedIds,
    balance,
    rewards,
    difficulty,
    habitPoints,
    customPoints,
    dayAward,
    onToggleSelection: toggleSelection,
    onCommit: commit,
    onCompleteHabit: completeHabit,
    onNextDay: nextDay,
    onChooseDifficulty: chooseDifficulty,
    onChangeCustomPoints: changeCustomPoints,
    onSaveReward: saveReward,
    onDeleteReward: (rewardId) => {
      const reward = rewards.find((item) => item.id === rewardId);
      if (reward) {
        setPendingDelete(reward);
      }
    },
    onConfirmDeleteReward: deleteReward,
    onRedeemReward: (rewardId) => {
      const reward = rewards.find((item) => item.id === rewardId);
      if (reward && !reward.redeemed && balance >= reward.cost) {
        setPendingRedemption(reward);
      }
    },
    onConfirmRedeemReward: redeemReward,
    onEditReward: openRewardEditor,
    onAddReward: openNewReward,
    onEditHabit: () => setPage("habit"),
  };

  return (
    <main className="pr-stage">
      <PhoneFrame mood={phase === "complete" ? "celebrate" : "default"}>
        <div className={`pr-phone pr-phone--${variant.toLowerCase()}`}>
          {variant === "A" ? <VariantA {...props} /> : null}
          {variant === "B" ? <VariantB {...props} /> : null}
          {variant === "C" ? <VariantC {...props} /> : null}
        </div>
      </PhoneFrame>

      <PrototypeSwitcher current={variant} onChange={changeVariant} />

      {rewardDraft ? (
        <RewardEditor
          draft={rewardDraft}
          editing={Boolean(editingRewardId)}
          onClose={() => setRewardDraft(null)}
          onSave={(draft) => saveReward(draft, editingRewardId)}
        />
      ) : null}

      {pendingRedemption ? (
        <ConfirmationDialog
          eyebrow="Confirm redemption"
          title={`Redeem ${pendingRedemption.name}?`}
          description={`${formatPoints(pendingRedemption.cost)} will leave your shared balance. This reward will move to Redeemed and can't be undone.`}
          confirmLabel="Redeem reward"
          onClose={() => setPendingRedemption(null)}
          onConfirm={() => props.onConfirmRedeemReward(pendingRedemption.id)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmationDialog
          eyebrow="Remove reward"
          title={`Delete ${pendingDelete.name}?`}
          description="This removes the active goal. Your point balance will stay the same."
          confirmLabel="Delete reward"
          destructive
          onClose={() => setPendingDelete(null)}
          onConfirm={() => props.onConfirmDeleteReward(pendingDelete.id)}
        />
      ) : null}
    </main>
  );
}

function VariantA(props: PrototypeProps) {
  const activeTab =
    props.page === "rewards"
      ? "rewards"
      : props.page === "more"
        ? "more"
        : props.page === "orbit" || props.page === "habit"
          ? "orbit"
          : "today";

  return (
    <>
      {props.page === "today" ? <TodayA {...props} /> : null}
      {props.page === "rewards" ? <RewardsA {...props} /> : null}
      {props.page === "orbit" ? <OrbitA {...props} /> : null}
      {props.page === "more" ? <MoreA {...props} /> : null}
      {props.page === "habit" ? (
        <HabitEditorPage {...props} variant="A" />
      ) : null}
      <BottomNavigation
        variant="A"
        activeTab={activeTab}
        onNavigate={props.setPage}
      />
    </>
  );
}

function VariantB(props: PrototypeProps) {
  const activeTab =
    props.page === "orbit" || props.page === "habit"
      ? "orbit"
      : props.page === "more" || props.page === "rewards"
        ? "more"
        : "today";

  return (
    <>
      {props.page === "today" ? <TodayB {...props} /> : null}
      {props.page === "rewards" ? <RewardsB {...props} /> : null}
      {props.page === "orbit" ? <OrbitB {...props} /> : null}
      {props.page === "more" ? <MoreB {...props} /> : null}
      {props.page === "habit" ? (
        <HabitEditorPage {...props} variant="B" />
      ) : null}
      <BottomNavigation
        variant="B"
        activeTab={activeTab}
        onNavigate={props.setPage}
      />
    </>
  );
}

function VariantC(props: PrototypeProps) {
  const activeTab =
    props.page === "orbit" || props.page === "rewards" || props.page === "habit"
      ? "orbit"
      : props.page === "more"
        ? "more"
        : "today";

  return (
    <>
      {props.page === "today" ? <TodayC {...props} /> : null}
      {props.page === "rewards" || props.page === "orbit" ? (
        <OrbitC {...props} />
      ) : null}
      {props.page === "more" ? <MoreC {...props} /> : null}
      {props.page === "habit" ? (
        <HabitEditorPage {...props} variant="C" />
      ) : null}
      <BottomNavigation
        variant="C"
        activeTab={activeTab}
        onNavigate={props.setPage}
      />
    </>
  );
}

function TodayA(props: PrototypeProps) {
  if (props.phase === "complete") {
    return <Celebration {...props} variant="A" />;
  }

  return (
    <section className="pr-page pr-page--a">
      <header className="pr-header pr-header--brand">
        <div className="pr-brand">
          <span className="pr-brand__mark">o</span> orbii
        </div>
        <button
          className="pr-avatar"
          type="button"
          onClick={() => props.setPage("more")}
          aria-label="Open settings"
        >
          P
        </button>
      </header>
      <button
        className="pr-balance-banner pr-balance-banner--a"
        type="button"
        onClick={() => props.setPage("rewards")}
      >
        <span className="pr-balance-banner__icon">
          <Coins size={18} />
        </span>
        <span>
          <small>One balance for all your goals</small>
          <strong>{formatPoints(props.balance)}</strong>
        </span>
        <ArrowUpRight size={18} aria-hidden />
      </button>
      <div className="pr-page-heading">
        <span className="pr-eyebrow">WEDNESDAY · OCTOBER 8</span>
        <h1>Today’s Orbit</h1>
        <p>Small things, done with care.</p>
      </div>
      <TodayProgress {...props} variant="A" />
    </section>
  );
}

function TodayB(props: PrototypeProps) {
  if (props.phase === "complete") {
    return <Celebration {...props} variant="B" />;
  }

  return (
    <section className="pr-page pr-page--b">
      <header className="pr-header pr-header--compact">
        <div>
          <span className="pr-eyebrow">WEDNESDAY, OCT 8</span>
          <h1>Today</h1>
        </div>
        <button
          className="pr-balance-inline"
          type="button"
          onClick={() => props.setPage("more")}
        >
          <Coins size={16} />
          {props.balance.toLocaleString()}
        </button>
      </header>
      <div className="pr-b-focus-strip">
        <strong>Today’s Orbit</strong>
        <span>Fresh offer of five · choose what fits today</span>
      </div>
      <p className="pr-copy pr-copy--b">
        Your offer is ready. Choose what fits the day you have.
      </p>
      <TodayProgress {...props} variant="B" />
    </section>
  );
}

function TodayC(props: PrototypeProps) {
  if (props.phase === "complete") {
    return <Celebration {...props} variant="C" />;
  }

  return (
    <section className="pr-page pr-page--c">
      <header className="pr-header pr-header--c">
        <div className="pr-brand">
          <span className="pr-brand__mark">o</span> orbii
        </div>
        <span className="pr-date-dot">
          <span /> OCT 8
        </span>
      </header>
      <div className="pr-c-hero">
        <span className="pr-eyebrow">YOUR DAY, IN FOCUS</span>
        <h1>
          Today can be
          <br />a good day.
        </h1>
        <button
          className="pr-c-balance"
          type="button"
          onClick={() => props.setPage("orbit")}
        >
          <span>
            <Wallet size={17} /> Spendable points
          </span>
          <strong>
            {props.balance.toLocaleString()} <small>pts</small>
          </strong>
          <ChevronRight size={16} />
        </button>
      </div>
      <TodayProgress {...props} variant="C" />
    </section>
  );
}

function TodayProgress({ ...props }: PrototypeProps & { variant: VariantKey }) {
  const selectedHabits = props.habits.filter((habit) =>
    props.selectedIds.includes(habit.id),
  );
  const activeHabits = props.habits.filter((habit) =>
    props.selectedIds.includes(habit.id),
  );
  if (props.phase === "offer") {
    return (
      <div
        className={`pr-focus-list pr-focus-list--${props.variant.toLowerCase()}`}
      >
        <div className="pr-focus-list__heading">
          <div>
            <strong>
              {props.selectedIds.length === 0
                ? "Choose your focus"
                : "Your focus set"}
            </strong>
            <span>
              {props.selectedIds.length === 0
                ? "Nothing selected yet"
                : `${props.selectedIds.length} chosen · capacity ${props.selectedIds.length}`}
            </span>
          </div>
          <span className="pr-capacity-chip">OFFER OF 5</span>
        </div>
        <div className="pr-habit-list">
          {props.habits.map((habit) => {
            const selected = props.selectedIds.includes(habit.id);
            return (
              <button
                className="pr-habit-row"
                data-selected={selected ? "true" : "false"}
                type="button"
                key={habit.id}
                onClick={() => props.onToggleSelection(habit.id)}
                aria-pressed={selected}
              >
                <span className="pr-habit-glyph">{habit.glyph}</span>
                <span className="pr-habit-row__copy">
                  <strong>{habit.name}</strong>
                  <small>
                    {habit.id === "walk"
                      ? "outside · 15 min"
                      : habit.id === "read"
                        ? "unhurried · 10 min"
                        : habit.id === "breathe"
                          ? "reset · 3 min"
                          : habit.id === "stretch"
                            ? "mobility · 8 min"
                            : "care · 2 min"}
                  </small>
                </span>
                <span className="pr-points-tag">
                  +{habit.points} <small>pts</small>
                </span>
                <span className="pr-checkmark">
                  {selected ? <Check size={13} /> : null}
                </span>
              </button>
            );
          })}
        </div>
        <div className="pr-list-footer">
          <span>Each first check-off earns the points shown.</span>
          <button
            type="button"
            className="pr-text-link"
            onClick={props.onEditHabit}
          >
            Edit a point value
          </button>
        </div>
        <button
          type="button"
          className="pr-primary-action"
          onClick={props.onCommit}
          disabled={selectedHabits.length === 0}
        >
          {selectedHabits.length
            ? `Start today’s Orbit · ${selectedHabits.length}`
            : "Choose habits to continue"}
          <ChevronRight size={17} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`pr-focus-list pr-focus-list--active pr-focus-list--${props.variant.toLowerCase()}`}
    >
      <div className="pr-focus-list__heading">
        <div>
          <strong>
            {props.variant === "B" ? "Committed" : "Today’s commitment"}
          </strong>
          <span>
            {props.completedIds.length} of {activeHabits.length} complete
          </span>
        </div>
        <span className="pr-capacity-chip pr-capacity-chip--live">
          <span /> IN MOTION
        </span>
      </div>
      <div className="pr-habit-list">
        {activeHabits.map((habit) => {
          const done = props.completedIds.includes(habit.id);
          return (
            <button
              className="pr-habit-row pr-habit-row--active"
              data-done={done ? "true" : "false"}
              type="button"
              key={habit.id}
              onClick={() => props.onCompleteHabit(habit.id)}
              aria-pressed={done}
            >
              <span className="pr-habit-glyph">{habit.glyph}</span>
              <span className="pr-habit-row__copy">
                <strong>{habit.name}</strong>
                <small>{done ? "Done for today" : "Tap when finished"}</small>
              </span>
              <span className="pr-points-tag">
                +{habit.points} <small>pts</small>
              </span>
              <span className="pr-checkmark">
                {done ? <Check size={13} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pr-active-note">
        <Sparkles size={14} /> Points land once per habit each local day.
      </div>
      <button
        type="button"
        className="pr-text-link pr-active-edit"
        onClick={props.onEditHabit}
      >
        Edit habit point value
      </button>
    </div>
  );
}

function RewardsA(props: PrototypeProps) {
  const activeRewards = props.rewards.filter((reward) => !reward.redeemed);
  const redeemedRewards = props.rewards.filter((reward) => reward.redeemed);

  return (
    <section className="pr-page pr-page--a pr-rewards-page">
      <header className="pr-header pr-header--brand">
        <div className="pr-brand">
          <span className="pr-brand__mark">o</span> orbii
        </div>
        <button
          className="pr-icon-button"
          type="button"
          onClick={props.onAddReward}
          aria-label="Add reward"
        >
          <Plus size={19} />
        </button>
      </header>
      <div className="pr-page-heading">
        <span className="pr-eyebrow">
          A LITTLE SOMETHING TO LOOK FORWARD TO
        </span>
        <h1>Your rewards</h1>
        <p>Every goal grows from the same balance.</p>
      </div>
      <BalanceHero balance={props.balance} variant="A" />
      <div className="pr-reward-section-header">
        <div>
          <strong>Active goals</strong>
          <span>{activeRewards.length} in your Orbit</span>
        </div>
        <button type="button" onClick={props.onAddReward}>
          <Plus size={15} /> Add
        </button>
      </div>
      <div className="pr-a-reward-grid">
        {activeRewards.map((reward, index) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            balance={props.balance}
            index={index}
            onRedeem={() => props.onRedeemReward(reward.id)}
            onEdit={() => props.onEditReward(reward)}
            onDelete={() => props.onDeleteReward(reward.id)}
          />
        ))}
      </div>
      <RedeemedList rewards={redeemedRewards} variant="A" />
      <p className="pr-footnote">
        <CircleHelp size={13} /> Progress isn't reserved. Spending changes every
        goal.
      </p>
    </section>
  );
}

function RewardsB(props: PrototypeProps) {
  const activeRewards = props.rewards.filter((reward) => !reward.redeemed);
  const redeemedRewards = props.rewards.filter((reward) => reward.redeemed);

  return (
    <section className="pr-page pr-page--b pr-rewards-page">
      <header className="pr-header pr-header--compact">
        <div>
          <span className="pr-eyebrow">MORE · YOUR GOALS</span>
          <h1>Rewards</h1>
        </div>
        <button
          className="pr-icon-button"
          type="button"
          onClick={props.onAddReward}
          aria-label="Add reward"
        >
          <Plus size={19} />
        </button>
      </header>
      <div className="pr-b-balance-line">
        <div>
          <small>Available balance</small>
          <strong>
            {props.balance.toLocaleString()} <span>points</span>
          </strong>
        </div>
        <Wallet size={23} />
      </div>
      <p className="pr-copy pr-copy--b">
        Each reward tracks the same spendable balance. Nothing is set aside.
      </p>
      <div className="pr-b-reward-list">
        <div className="pr-b-section-label">
          <span>ACTIVE</span>
          <button type="button" onClick={props.onAddReward}>
            <Plus size={14} /> Add reward
          </button>
        </div>
        {activeRewards.map((reward) => (
          <RewardLedgerRow
            key={reward.id}
            reward={reward}
            balance={props.balance}
            onRedeem={() => props.onRedeemReward(reward.id)}
            onEdit={() => props.onEditReward(reward)}
            onDelete={() => props.onDeleteReward(reward.id)}
          />
        ))}
      </div>
      <RedeemedList rewards={redeemedRewards} variant="B" />
    </section>
  );
}

function RewardsC(props: PrototypeProps) {
  const activeRewards = props.rewards.filter((reward) => !reward.redeemed);
  const redeemedRewards = props.rewards.filter((reward) => reward.redeemed);

  return (
    <section className="pr-page pr-page--c pr-page--c-rewards">
      <header className="pr-c-rewards-heading">
        <span className="pr-eyebrow">YOUR ORBIT · GOALS</span>
        <button
          className="pr-icon-button"
          type="button"
          onClick={props.onAddReward}
          aria-label="Add reward"
        >
          <Plus size={19} />
        </button>
        <h1>
          What are you
          <br />
          working toward?
        </h1>
        <p>Earn points as you show up. Use them when a goal feels close.</p>
      </header>
      <div className="pr-c-goal-balance">
        <span>Shared balance</span>
        <strong>
          {props.balance.toLocaleString()}
          <small> points</small>
        </strong>
      </div>
      <div className="pr-c-goal-list">
        {activeRewards.map((reward, index) => (
          <RewardGoalRow
            key={reward.id}
            reward={reward}
            balance={props.balance}
            index={index}
            onRedeem={() => props.onRedeemReward(reward.id)}
            onEdit={() => props.onEditReward(reward)}
            onDelete={() => props.onDeleteReward(reward.id)}
          />
        ))}
      </div>
      <RedeemedList rewards={redeemedRewards} variant="C" />
      <p className="pr-c-reward-note">
        Your points aren’t reserved for one goal. A redemption updates progress
        across all of them.
      </p>
    </section>
  );
}

function OrbitA(props: PrototypeProps) {
  return (
    <section className="pr-page pr-page--a">
      <PageHeading
        eyebrow="EVERYTHING YOU CARE ABOUT"
        title="Your Orbit"
        subtitle="A few habits come into focus each day."
      />
      <HabitOrbitList {...props} variant="A" />
    </section>
  );
}

function OrbitB(props: PrototypeProps) {
  return (
    <section className="pr-page pr-page--b">
      <header className="pr-header pr-header--compact">
        <div>
          <span className="pr-eyebrow">YOUR HABIT COLLECTION</span>
          <h1>Orbit</h1>
        </div>
        <span className="pr-count-pill">6 habits</span>
      </header>
      <p className="pr-copy pr-copy--b">
        Your full set stays here. Today’s focus changes with you.
      </p>
      <HabitOrbitList {...props} variant="B" />
    </section>
  );
}

function OrbitC(props: PrototypeProps) {
  return (
    <>
      <div className="pr-c-orbit-switch">
        <button
          type="button"
          data-on={props.page === "orbit" ? "true" : "false"}
          onClick={() => props.setPage("orbit")}
        >
          Habits
        </button>
        <button
          type="button"
          data-on={props.page === "rewards" ? "true" : "false"}
          onClick={() => props.setPage("rewards")}
        >
          Rewards
        </button>
      </div>
      {props.page === "rewards" ? (
        <RewardsC {...props} />
      ) : (
        <section className="pr-page pr-page--c pr-page--c-orbit">
          <header className="pr-c-orbit-heading">
            <span className="pr-eyebrow">YOUR ORBIT · HABITS</span>
            <h1>
              Keep what
              <br />
              matters close.
            </h1>
            <p>Your growing collection makes room for a small daily focus.</p>
          </header>
          <div className="pr-c-orbit-summary">
            <Compass size={18} />
            <span>6 habits in your Orbit</span>
            <button type="button" onClick={props.onEditHabit}>
              Point values <ChevronRight size={15} />
            </button>
          </div>
          <HabitOrbitList {...props} variant="C" />
        </section>
      )}
    </>
  );
}

function HabitOrbitList({
  ...props
}: PrototypeProps & { variant: VariantKey }) {
  const orbitHabits: Habit[] = [
    ...props.habits,
    { id: "journal", name: "Write one honest line", glyph: "✎", points: 20 },
  ];

  return (
    <>
      <div
        className={`pr-orbit-habits pr-orbit-habits--${props.variant.toLowerCase()}`}
      >
        {orbitHabits.map((habit, index) => (
          <div className="pr-orbit-habit" key={habit.id}>
            <span className="pr-orbit-habit__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="pr-habit-glyph">{habit.glyph}</span>
            <strong>{habit.name}</strong>
            <span className="pr-points-tag">
              {habit.points} <small>pts</small>
            </span>
          </div>
        ))}
      </div>
      <button
        className="pr-secondary-action"
        type="button"
        onClick={props.onEditHabit}
      >
        <Pencil size={15} /> Set a habit’s point value
      </button>
    </>
  );
}

function MoreA(props: PrototypeProps) {
  return (
    <section className="pr-page pr-page--a">
      <PageHeading
        eyebrow="MAKE ORBII YOURS"
        title="More"
        subtitle="A few things to make the ritual feel right."
      />
      <div className="pr-settings-list">
        <SettingsRow
          icon={<Coins size={18} />}
          title="Habit point values"
          subtitle="Easy 10 · Medium 20 · Hard 30"
          onClick={props.onEditHabit}
        />
        <SettingsRow
          icon={<Gift size={18} />}
          title="Rewards"
          subtitle={`${props.rewards.filter((item) => !item.redeemed).length} active goals`}
          onClick={() => props.setPage("rewards")}
        />
        <SettingsRow
          icon={<CircleHelp size={18} />}
          title="How points work"
          subtitle="Earn a little each time you show up"
          onClick={() => props.setPage("today")}
        />
      </div>
    </section>
  );
}

function MoreB(props: PrototypeProps) {
  return (
    <section className="pr-page pr-page--b pr-more-b">
      <header className="pr-header pr-header--compact">
        <div>
          <span className="pr-eyebrow">YOUR SPACE</span>
          <h1>More</h1>
        </div>
        <button
          className="pr-avatar pr-avatar--small"
          type="button"
          aria-label="Profile"
        >
          P
        </button>
      </header>
      <div className="pr-b-balance-line pr-b-balance-line--settings">
        <div>
          <small>Your spendable balance</small>
          <strong>
            {props.balance.toLocaleString()} <span>points</span>
          </strong>
        </div>
        <Wallet size={23} />
      </div>
      <div className="pr-settings-list pr-settings-list--b">
        <p className="pr-b-section-label">
          <span>YOUR ORBII</span>
        </p>
        <SettingsRow
          icon={<Gift size={18} />}
          title="Rewards & goals"
          subtitle="See progress and redeem points"
          onClick={() => props.setPage("rewards")}
        />
        <SettingsRow
          icon={<Coins size={18} />}
          title="Habit point values"
          subtitle="Easy, medium, hard, or custom"
          onClick={props.onEditHabit}
        />
        <SettingsRow
          icon={<CircleHelp size={18} />}
          title="Point rules"
          subtitle="How you earn and spend"
          onClick={() => props.setPage("rewards")}
        />
      </div>
      <p className="pr-muted-callout">
        Your balance is shared across all active rewards. It never goes below
        zero.
      </p>
    </section>
  );
}

function MoreC(props: PrototypeProps) {
  return (
    <section className="pr-page pr-page--c pr-more-c">
      <header className="pr-header pr-header--c">
        <div className="pr-brand">
          <span className="pr-brand__mark">o</span> orbii
        </div>
        <span className="pr-date-dot">
          <span /> YOUR SPACE
        </span>
      </header>
      <PageHeading
        eyebrow="PREFERENCES"
        title="A little more"
        subtitle="Shape your Orbit around real life."
      />
      <div className="pr-c-setting-balance">
        <Coins size={18} />
        <span>
          <small>Points to spend</small>
          <strong>{props.balance.toLocaleString()}</strong>
        </span>
        <button
          type="button"
          onClick={() => props.setPage("rewards")}
          aria-label="Rewards"
        >
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="pr-settings-list pr-settings-list--c">
        <SettingsRow
          icon={<Gift size={18} />}
          title="Your rewards"
          subtitle="Goals growing in your Orbit"
          onClick={() => props.setPage("rewards")}
        />
        <SettingsRow
          icon={<Pencil size={18} />}
          title="Habit point values"
          subtitle="Easy 10 · Medium 20 · Hard 30"
          onClick={props.onEditHabit}
        />
      </div>
    </section>
  );
}

function HabitEditorPage({
  ...props
}: PrototypeProps & { variant: VariantKey }) {
  return (
    <section
      className={`pr-page pr-page--${props.variant.toLowerCase()} pr-habit-editor-page`}
    >
      <header className="pr-header pr-header--back">
        <button
          className="pr-icon-button"
          type="button"
          onClick={() => props.setPage("orbit")}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="pr-eyebrow">EDIT HABIT</span>
        <span className="pr-header-spacer" />
      </header>
      <div className="pr-page-heading">
        <span className="pr-eyebrow">POINTS PER FIRST CHECK-OFF</span>
        <h1>Choose the effort.</h1>
        <p>Pick a value that feels fair for “Walk by the river.”</p>
      </div>
      <div className="pr-difficulty-list">
        {(["easy", "medium", "hard"] as const).map((choice) => (
          <button
            type="button"
            className="pr-difficulty-option"
            data-on={props.difficulty === choice ? "true" : "false"}
            key={choice}
            onClick={() => props.onChooseDifficulty(choice)}
          >
            <span
              className={`pr-difficulty-mark pr-difficulty-mark--${choice}`}
            >
              {choice === "easy" ? "·" : choice === "medium" ? "••" : "•••"}
            </span>
            <span>
              <strong>{choice[0].toUpperCase() + choice.slice(1)}</strong>
              <small>
                {choice === "easy"
                  ? "a gentle start"
                  : choice === "medium"
                    ? "a steady effort"
                    : "a bigger stretch"}
              </small>
            </span>
            <b>
              {presetPoints[choice]} <small>pts</small>
            </b>
            <span className="pr-radio">
              {props.difficulty === choice ? <span /> : null}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="pr-difficulty-option"
          data-on={props.difficulty === "custom" ? "true" : "false"}
          onClick={() => props.onChooseDifficulty("custom")}
        >
          <span className="pr-difficulty-mark pr-difficulty-mark--custom">
            <Pencil size={16} />
          </span>
          <span>
            <strong>Custom</strong>
            <small>Make it your own</small>
          </span>
          <b>
            {props.habitPoints} <small>pts</small>
          </b>
          <span className="pr-radio">
            {props.difficulty === "custom" ? <span /> : null}
          </span>
        </button>
      </div>
      {props.difficulty === "custom" ? (
        <label className="pr-custom-point-field">
          Custom point value
          <span className="pr-custom-point-input">
            <input
              type="number"
              min="1"
              max="100"
              value={props.customPoints}
              onChange={(event) =>
                props.onChangeCustomPoints(Number(event.target.value))
              }
            />
            <span>points · 1–100</span>
          </span>
        </label>
      ) : null}
      <div className="pr-editor-note">
        <Sparkles size={15} /> The committed Orbit keeps its point snapshot.
        Changes apply next time.
      </div>
      <button
        className="pr-primary-action pr-habit-save"
        type="button"
        onClick={() => props.setPage("orbit")}
      >
        Save habit value
        <Check size={16} />
      </button>
    </section>
  );
}

function Celebration({ ...props }: PrototypeProps & { variant: VariantKey }) {
  const award = props.dayAward ?? { habitPoints: 30, total: 50 };
  const destination: Page =
    props.variant === "A"
      ? "rewards"
      : props.variant === "B"
        ? "more"
        : "orbit";
  const destinationLabel =
    props.variant === "B"
      ? "Open More to see rewards"
      : props.variant === "C"
        ? "Explore your Orbit goals"
        : "See what you’re working toward";

  return (
    <section
      className={`pr-celebration pr-celebration--${props.variant.toLowerCase()}`}
    >
      <div className="pr-confetti" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="pr-celebration__mark">
        <BadgeCheck size={31} />
      </div>
      <span className="pr-eyebrow">A DAY WELL SPENT</span>
      <h1>
        Today’s Orbit
        <br />
        complete.
      </h1>
      <p>
        You showed up for the things you care about. The rest stayed in orbit.
      </p>
      <div className="pr-earned-card">
        <div>
          <Sparkles size={17} />
          <span>You earned</span>
        </div>
        <strong>
          {award.total} <small>points</small>
        </strong>
        <footer>
          {award.habitPoints} habit points <span>+</span> 20 completion bonus
        </footer>
      </div>
      <div className="pr-new-balance">
        <span>New spendable balance</span>
        <strong>
          {props.balance.toLocaleString()} <small>pts</small>
        </strong>
      </div>
      <button
        className="pr-primary-action"
        type="button"
        onClick={() => props.setPage(destination)}
      >
        {destinationLabel}
        <ArrowUpRight size={17} />
      </button>
      <button
        className="pr-text-link pr-next-day"
        type="button"
        onClick={props.onNextDay}
      >
        Preview another day
      </button>
    </section>
  );
}

function BottomNavigation({
  ...props
}: {
  variant: VariantKey;
  activeTab: string;
  onNavigate: (page: Page) => void;
}) {
  const items =
    props.variant === "A"
      ? [
          { page: "today" as const, label: "Today", icon: <Home size={18} /> },
          {
            page: "orbit" as const,
            label: "Orbit",
            icon: <Compass size={18} />,
          },
          {
            page: "rewards" as const,
            label: "Rewards",
            icon: <Gift size={18} />,
          },
          {
            page: "more" as const,
            label: "More",
            icon: <MoreHorizontal size={18} />,
          },
        ]
      : [
          { page: "today" as const, label: "Today", icon: <Home size={18} /> },
          {
            page: "orbit" as const,
            label: "Orbit",
            icon: <Compass size={18} />,
          },
          {
            page: "more" as const,
            label: "More",
            icon: <MoreHorizontal size={18} />,
          },
        ];

  return (
    <nav
      className={`pr-bottom-nav pr-bottom-nav--${props.variant.toLowerCase()}`}
      aria-label="App navigation"
    >
      {items.map((item) => (
        <button
          type="button"
          key={item.page}
          data-active={props.activeTab === item.page ? "true" : "false"}
          onClick={() => props.onNavigate(item.page)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function BalanceHero({ ...props }: { balance: number; variant: VariantKey }) {
  return (
    <div
      className={`pr-balance-hero pr-balance-hero--${props.variant.toLowerCase()}`}
    >
      <div className="pr-balance-hero__top">
        <span>
          <Wallet size={15} /> SPENDABLE BALANCE
        </span>
        <span>•••</span>
      </div>
      <strong>
        {props.balance.toLocaleString()} <small>points</small>
      </strong>
      <div className="pr-balance-hero__footer">
        <span>Available for any active reward</span>
        <span className="pr-balance-hero__orb">✦</span>
      </div>
    </div>
  );
}

function RewardCard({
  ...props
}: {
  reward: Reward;
  balance: number;
  index: number;
  onRedeem: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canRedeem = props.balance >= props.reward.cost;

  return (
    <article className="pr-reward-card">
      <div
        className={`pr-reward-card__art pr-reward-card__art--${props.index + 1}`}
      >
        <Gift size={19} />
      </div>
      <div className="pr-reward-card__body">
        <div>
          <h2>{props.reward.name}</h2>
          <span>{props.reward.cost.toLocaleString()} points</span>
        </div>
        <RewardProgress balance={props.balance} cost={props.reward.cost} />
      </div>
      <div className="pr-reward-card__actions">
        <button
          type="button"
          className="pr-redeem-button"
          disabled={!canRedeem}
          onClick={props.onRedeem}
        >
          {canRedeem
            ? "Redeem"
            : `${(props.reward.cost - props.balance).toLocaleString()} to go`}
        </button>
        <RewardEditActions onEdit={props.onEdit} onDelete={props.onDelete} />
      </div>
    </article>
  );
}

function RewardLedgerRow({
  ...props
}: {
  reward: Reward;
  balance: number;
  onRedeem: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canRedeem = props.balance >= props.reward.cost;

  return (
    <article className="pr-ledger-row">
      <div className="pr-ledger-row__top">
        <div className="pr-ledger-gift">
          <Gift size={17} />
        </div>
        <div className="pr-ledger-row__name">
          <strong>{props.reward.name}</strong>
          <span>
            {props.reward.cost.toLocaleString()} points ·{" "}
            {canRedeem
              ? "Ready when you are"
              : `${(props.reward.cost - props.balance).toLocaleString()} more to go`}
          </span>
        </div>
        <RewardEditActions onEdit={props.onEdit} onDelete={props.onDelete} />
      </div>
      <RewardProgress balance={props.balance} cost={props.reward.cost} />
      <button
        className="pr-b-redeem-link"
        type="button"
        disabled={!canRedeem}
        onClick={props.onRedeem}
      >
        {canRedeem ? "Redeem reward" : "Keep earning"}
        <ArrowUpRight size={15} />
      </button>
    </article>
  );
}

function RewardGoalRow({
  ...props
}: {
  reward: Reward;
  balance: number;
  index: number;
  onRedeem: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const canRedeem = props.balance >= props.reward.cost;

  return (
    <article className="pr-goal-row">
      <div
        className={`pr-goal-row__symbol pr-goal-row__symbol--${props.index + 1}`}
      >
        <span>{props.index === 0 ? "✳" : props.index === 1 ? "◌" : "⌁"}</span>
      </div>
      <div className="pr-goal-row__main">
        <div className="pr-goal-row__title">
          <div>
            <span className="pr-eyebrow">
              GOAL {String(props.index + 1).padStart(2, "0")}
            </span>
            <h2>{props.reward.name}</h2>
          </div>
          <RewardEditActions onEdit={props.onEdit} onDelete={props.onDelete} />
        </div>
        <div className="pr-goal-row__progress">
          <RewardProgress balance={props.balance} cost={props.reward.cost} />
          <span>
            {props.balance.toLocaleString()} /{" "}
            {props.reward.cost.toLocaleString()}
          </span>
        </div>
        <button
          className="pr-goal-redeem"
          type="button"
          disabled={!canRedeem}
          onClick={props.onRedeem}
        >
          {canRedeem
            ? "Use points for this"
            : `${(props.reward.cost - props.balance).toLocaleString()} points to go`}
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

function RewardProgress({ ...props }: { balance: number; cost: number }) {
  const percent = Math.min(100, Math.round((props.balance / props.cost) * 100));

  return (
    <div
      className="pr-progress-track"
      role="progressbar"
      aria-label={`Reward progress: ${percent}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function RewardEditActions({
  ...props
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="pr-reward-edit-actions">
      <button type="button" onClick={props.onEdit} aria-label="Edit reward">
        <Pencil size={14} />
      </button>
      <button type="button" onClick={props.onDelete} aria-label="Delete reward">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function RedeemedList({
  ...props
}: {
  rewards: Reward[];
  variant: VariantKey;
}) {
  if (props.rewards.length === 0) {
    return null;
  }

  return (
    <section
      className={`pr-redeemed-list pr-redeemed-list--${props.variant.toLowerCase()}`}
    >
      <div className="pr-redeemed-list__title">
        <span>REDEEMED</span>
        <span>READ ONLY</span>
      </div>
      {props.rewards.map((reward) => (
        <div className="pr-redeemed-row" key={reward.id}>
          <span>
            <Check size={13} />
          </span>
          <strong>{reward.name}</strong>
          <small>{reward.cost.toLocaleString()} pts</small>
        </div>
      ))}
    </section>
  );
}

function RewardEditor({
  ...props
}: {
  draft: RewardDraft;
  editing: boolean;
  onClose: () => void;
  onSave: (draft: RewardDraft) => void;
}) {
  const [name, setName] = useState(props.draft.name);
  const [cost, setCost] = useState(String(props.draft.cost));
  const parsedCost = Number(cost);
  const canSave =
    name.trim().length > 0 && Number.isInteger(parsedCost) && parsedCost > 0;

  return (
    <div
      className="pr-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <section
        className="pr-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-reward-editor-title"
      >
        <div className="pr-modal-handle" />
        <header className="pr-modal-header">
          <div>
            <span className="pr-eyebrow">YOUR NEXT LITTLE GOAL</span>
            <h2 id="pr-reward-editor-title">
              {props.editing ? "Edit reward" : "Add a reward"}
            </h2>
          </div>
          <button
            type="button"
            className="pr-icon-button"
            onClick={props.onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        <label className="pr-modal-field">
          Reward name
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="A slow Saturday"
          />
        </label>
        <label className="pr-modal-field">
          Point cost
          <span className="pr-cost-field">
            <input
              type="number"
              min="1"
              step="1"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
            />
            <span>points</span>
          </span>
        </label>
        <p className="pr-modal-hint">
          A positive whole number. Your balance is shared across all rewards.
        </p>
        <button
          className="pr-primary-action"
          type="button"
          disabled={!canSave}
          onClick={() => props.onSave({ name: name.trim(), cost: parsedCost })}
        >
          {props.editing ? "Save changes" : "Add reward"}
          <Check size={16} />
        </button>
      </section>
    </div>
  );
}

function ConfirmationDialog({
  ...props
}: {
  eyebrow: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="pr-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <section
        className="pr-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pr-confirm-title"
      >
        <div
          className="pr-confirm-icon"
          data-destructive={props.destructive ? "true" : "false"}
        >
          {props.destructive ? <Trash2 size={20} /> : <Gift size={20} />}
        </div>
        <span className="pr-eyebrow">{props.eyebrow}</span>
        <h2 id="pr-confirm-title">{props.title}</h2>
        <p>{props.description}</p>
        <button
          className={
            props.destructive
              ? "pr-primary-action pr-primary-action--danger"
              : "pr-primary-action"
          }
          type="button"
          onClick={props.onConfirm}
        >
          {props.confirmLabel}
          <Check size={16} />
        </button>
        <button className="pr-text-link" type="button" onClick={props.onClose}>
          Keep it for now
        </button>
      </section>
    </div>
  );
}

function PrototypeSwitcher({
  ...props
}: {
  current: VariantKey;
  onChange: (variant: VariantKey) => void;
}) {
  const index = variants.findIndex((variant) => variant.key === props.current);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, [contenteditable]")
      ) {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + variants.length) % variants.length;
      props.onChange(variants[nextIndex].key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, props.onChange]);

  const move = (direction: number) => {
    const nextIndex = (index + direction + variants.length) % variants.length;
    props.onChange(variants[nextIndex].key);
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <nav className="pr-prototype-switcher" aria-label="Prototype variations">
      <button
        type="button"
        onClick={() => move(-1)}
        aria-label="Previous variation"
      >
        <ArrowLeft size={16} />
      </button>
      <span>
        <small>UI STUDY</small>
        <strong>
          {props.current} <i>—</i> {variants[index].name}
        </strong>
      </span>
      <button type="button" onClick={() => move(1)} aria-label="Next variation">
        <ArrowRight size={16} />
      </button>
    </nav>
  );
}

function PageHeading({
  ...props
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="pr-page-heading">
      <span className="pr-eyebrow">{props.eyebrow}</span>
      <h1>{props.title}</h1>
      <p>{props.subtitle}</p>
    </div>
  );
}

function SettingsRow({
  ...props
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button className="pr-settings-row" type="button" onClick={props.onClick}>
      <span className="pr-settings-row__icon">{props.icon}</span>
      <span className="pr-settings-row__copy">
        <strong>{props.title}</strong>
        <small>{props.subtitle}</small>
      </span>
      <ChevronRight size={17} />
    </button>
  );
}
