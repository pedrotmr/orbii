import { ConvexProvider } from "convex/react";
import App from "../App";
import { convex } from "./convexClient";

export default function ConvexAppRoot() {
  return (
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  );
}
