import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PointsHistoryError from "./points-history-error";

interface PointsHistoryErrorBoundaryProps {
  children: ReactNode;
}

export default function PointsHistoryErrorBoundary({
  children,
}: PointsHistoryErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <PointsHistoryError onRetry={resetErrorBoundary} />
      )}
      onError={(error, errorInfo) => {
        console.error("Failed to load points history", error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
