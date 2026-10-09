import {
  Circle,
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
  offset,
  padding,
  progressViewStyle,
  rotationEffect,
  strokeBorder,
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

  // Expo serializes this body without imports or closures. Keep its helpers local.

  const accentColor = environment.isLuminanceReduced
    ? (props.reducedLuminanceColor ?? props.accentColor)
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
  const logoColor = environment.isLuminanceReduced
    ? accentColor
    : (props.logoColor ?? accentColor);
  const logoDotColor = environment.isLuminanceReduced
    ? accentColor
    : (props.logoDotColor ?? accentColor);
  const renderMark = (size: number) => {
    const scale = size / 64;

    return (
      <ZStack
        alignment="center"
        modifiers={[
          frame({ width: size, height: size }),
          accessibilityHidden(),
        ]}
      >
        <Circle
          modifiers={[
            foregroundStyle("transparent"),
            strokeBorder({
              content: logoColor,
              style: {
                lineWidth: 7 * scale,
                lineCap: "round",
                dash: [110 * scale, 24 * scale],
              },
              shape: "circle",
            }),
            frame({ width: 49 * scale, height: 49 * scale }),
            rotationEffect(-34),
          ]}
        />
        <Circle
          modifiers={[
            foregroundStyle(logoDotColor),
            frame({ width: 9 * scale, height: 9 * scale }),
            offset({ x: 15 * scale, y: -16 * scale }),
          ]}
        />
      </ZStack>
    );
  };
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
            {renderMark(props.spacing.logoSize)}
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
        {renderMark(18)}
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
    compactLeading: renderMark(22),
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
        {renderMark(16)}
      </ZStack>
    ),
    expandedLeading: renderMark(24),
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
