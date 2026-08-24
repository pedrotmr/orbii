import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  mood?: "default" | "reveal" | "celebrate";
};

export function PhoneFrame({ children, mood = "default" }: Props) {
  return (
    <div className="phone-shell">
      <div className="phone-atmosphere" data-mood={mood === "default" ? undefined : mood} />
      <div className="phone-content">{children}</div>
    </div>
  );
}
