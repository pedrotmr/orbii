import { Component, type ReactNode } from "react";
import PointsHistoryError from "./points-history-error";

interface PointsHistoryErrorBoundaryProps {
  children: ReactNode;
}

interface PointsHistoryErrorBoundaryState {
  hasError: boolean;
}

export default class PointsHistoryErrorBoundary extends Component<
  PointsHistoryErrorBoundaryProps,
  PointsHistoryErrorBoundaryState
> {
  state: PointsHistoryErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <PointsHistoryError
          onRetry={() => {
            this.setState({ hasError: false });
          }}
        />
      );
    }

    return this.props.children;
  }
}
