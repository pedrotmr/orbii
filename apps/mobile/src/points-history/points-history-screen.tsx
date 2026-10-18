import ScreenScaffold from "../components/layout/screen-scaffold";
import PointsHistoryContent from "./points-history-screen/points-history-content";

export default function PointsHistoryScreen() {
  return (
    <ScreenScaffold scrollable={false}>
      <PointsHistoryContent />
    </ScreenScaffold>
  );
}
