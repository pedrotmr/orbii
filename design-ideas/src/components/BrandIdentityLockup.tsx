import type { BrandDirection } from "@/components/BrandIdentityMark";
import BrandIdentityMark from "@/components/BrandIdentityMark";

interface BrandIdentityLockupProps {
  direction: BrandDirection;
  scale?: "small" | "medium" | "large" | "splash";
}

export default function BrandIdentityLockup({
  direction,
  scale = "medium",
}: BrandIdentityLockupProps) {
  const markSize =
    scale === "splash"
      ? 94
      : scale === "large"
        ? 58
        : scale === "medium"
          ? 34
          : 24;

  return (
    <div
      aria-label="Orbii"
      className={`identity-lockup identity-lockup--${direction.toLowerCase()} identity-lockup--${scale}`}
      role="img"
    >
      <BrandIdentityMark direction={direction} size={markSize} />
      <span className="identity-wordmark">
        Orb<span className="identity-wordmark__ii">ii</span>
      </span>
    </div>
  );
}
