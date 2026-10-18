import ScreenScaffold from "../components/layout/screen-scaffold";
import PointsHistoryContent from "./points-history-screen/points-history-content";
import PointsHistoryErrorBoundary from "./points-history-screen/points-history-error-boundary";

export default function PointsHistoryScreen() {
  return (
    <ScreenScaffold scrollable={false}>
      <PointsHistoryErrorBoundary>
        <PointsHistoryContent />
      </PointsHistoryErrorBoundary>
    </ScreenScaffold>
  );
}
