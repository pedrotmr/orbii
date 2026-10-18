import PointsHistoryContent from "./points-history-screen/points-history-content";
import PointsHistoryErrorBoundary from "./points-history-screen/points-history-error-boundary";

export default function PointsHistoryScreen() {
  return (
    <PointsHistoryErrorBoundary>
      <PointsHistoryContent />
    </PointsHistoryErrorBoundary>
  );
}
