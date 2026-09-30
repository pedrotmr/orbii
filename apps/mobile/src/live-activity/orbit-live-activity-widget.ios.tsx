import {
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
  ZStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  progressViewStyle,
  tint,
  truncationMode,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";
import type { OrbitLiveActivityContent } from "./orbit-live-activity-content";

function OrbitLiveActivityWidget(
  props: OrbitLiveActivityContent,
  environment: LiveActivityEnvironment,
) {
  "widget";

  const accentColor = environment.isLuminanceReduced
    ? "#FFFFFF"
    : props.accentColor;
  const progress =
    props.totalCount > 0
      ? Math.min(1, Math.max(0, props.completedCount / props.totalCount))
      : 0;
  const progressLabel =
    props.phase === "complete"
      ? "Complete"
      : `${props.completedCount} of ${props.totalCount}`;
  const progressAccessibilityLabel =
    props.phase === "complete"
      ? "Today’s Orbit complete"
      : `${props.completedCount} of ${props.totalCount} habits complete`;
  const compactProgress = `${props.completedCount}/${props.totalCount}`;
  const renderHabitRows = () =>
    props.habits.map((habit) => (
      <HStack
        key={habit.id}
        alignment="center"
        spacing={props.spacing.iconGap}
        modifiers={[
          accessibilityElement("combine"),
          accessibilityLabel(
            `${habit.name}, ${habit.isComplete ? "completed" : "not completed"}`,
          ),
        ]}
      >
        <Image
          systemName={habit.isComplete ? "checkmark.circle.fill" : "circle"}
          size={16}
          color={habit.isComplete ? accentColor : undefined}
          modifiers={[accessibilityHidden()]}
        />
        <Text
          modifiers={[
            font({ size: 15, weight: "medium", design: "rounded" }),
            foregroundStyle({ type: "hierarchical", style: "primary" }),
            lineLimit(1),
            truncationMode("tail"),
            minimumScaleFactor(0.85),
          ]}
        >
          {habit.name}
        </Text>
      </HStack>
    ));

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={props.spacing.sectionGap}
        modifiers={[
          padding({
            horizontal: props.spacing.horizontalInset,
            vertical: props.spacing.verticalInset,
          }),
        ]}
      >
        <HStack alignment="center" spacing={props.spacing.sectionGap}>
          <ZStack alignment="center">
            <ProgressView
              value={progress}
              modifiers={[
                progressViewStyle("circular"),
                tint(accentColor),
                frame({
                  width: props.spacing.progressRingSize,
                  height: props.spacing.progressRingSize,
                }),
                accessibilityHidden(),
              ]}
            />
            <Image
              systemName="circle.grid.2x2.fill"
              size={props.spacing.logoSize}
              color={accentColor}
              modifiers={[accessibilityHidden()]}
            />
          </ZStack>
          <Text
            modifiers={[
              font({
                textStyle: "headline",
                weight: "semibold",
                design: "rounded",
              }),
              foregroundStyle({ type: "hierarchical", style: "primary" }),
              lineLimit(1),
              minimumScaleFactor(0.85),
            ]}
          >
            Today’s Orbit
          </Text>
          <Spacer />
          <Text
            modifiers={[
              font({
                textStyle: "subheadline",
                weight: "semibold",
                design: "rounded",
              }),
              foregroundStyle(accentColor),
              lineLimit(1),
              accessibilityLabel(progressAccessibilityLabel),
            ]}
          >
            {progressLabel}
          </Text>
        </HStack>
        <VStack
          alignment="leading"
          spacing={props.spacing.rowGap}
          modifiers={[padding({ leading: props.spacing.listLeadingInset })]}
        >
          {renderHabitRows()}
        </VStack>
      </VStack>
    ),
    bannerSmall: (
      <HStack alignment="center" spacing={props.spacing.compactGap}>
        <Image
          systemName="circle.grid.2x2.fill"
          size={14}
          color={accentColor}
          modifiers={[accessibilityHidden()]}
        />
        <Text
          modifiers={[
            font({ size: 13, weight: "semibold", design: "rounded" }),
            foregroundStyle({ type: "hierarchical", style: "primary" }),
            lineLimit(1),
          ]}
        >
          Orbit
        </Text>
        <Spacer />
        <Text
          modifiers={[
            font({ size: 13, weight: "semibold", design: "rounded" }),
            foregroundStyle(accentColor),
            lineLimit(1),
            accessibilityLabel(progressAccessibilityLabel),
          ]}
        >
          {compactProgress}
        </Text>
      </HStack>
    ),
    compactLeading: (
      <Image systemName="circle.grid.2x2.fill" color={accentColor} size={16} />
    ),
    compactTrailing: (
      <Text
        modifiers={[font({ size: 12, weight: "semibold", design: "rounded" })]}
      >
        {compactProgress}
      </Text>
    ),
    minimal: (
      <ZStack alignment="center">
        <ProgressView
          value={progress}
          modifiers={[
            progressViewStyle("circular"),
            tint(accentColor),
            frame({ width: 27, height: 27 }),
            accessibilityLabel(progressAccessibilityLabel),
          ]}
        />
        <Image
          systemName="circle.grid.2x2.fill"
          size={10}
          color={accentColor}
          modifiers={[accessibilityHidden()]}
        />
      </ZStack>
    ),
    expandedLeading: (
      <Image systemName="circle.grid.2x2.fill" color={accentColor} size={18} />
    ),
    expandedCenter: (
      <VStack alignment="leading" spacing={props.spacing.microGap}>
        <Text
          modifiers={[
            font({
              textStyle: "subheadline",
              weight: "semibold",
              design: "rounded",
            }),
          ]}
        >
          Today’s Orbit
        </Text>
        <Text
          modifiers={[
            font({ size: 11, weight: "medium", design: "rounded" }),
            foregroundStyle({ type: "hierarchical", style: "secondary" }),
          ]}
        >
          {progressLabel}
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <Text
        modifiers={[
          font({ size: 13, weight: "semibold", design: "rounded" }),
          foregroundStyle(accentColor),
        ]}
      >
        {compactProgress}
      </Text>
    ),
    expandedBottom: (
      <VStack alignment="leading" spacing={props.spacing.rowGap}>
        {renderHabitRows()}
      </VStack>
    ),
  };
}

export default createLiveActivity("OrbitLiveActivity", OrbitLiveActivityWidget);
