import type { BrandDirection } from "@/components/BrandIdentityMark";

interface BrandIdentitySwitcherProps {
  direction: BrandDirection;
  name: string;
  onMove: (offset: number) => void;
}

export default function BrandIdentitySwitcher({
  direction,
  name,
  onMove,
}: BrandIdentitySwitcherProps) {
  return (
    <nav aria-label="Brand identity variations" className="identity-switcher">
      <button
        aria-label="Previous brand direction"
        className="identity-switcher__arrow"
        onClick={() => onMove(-1)}
        type="button"
      >
        ←
      </button>
      <div aria-live="polite" className="identity-switcher__label">
        <span>{direction}</span>
        <span>{name}</span>
      </div>
      <button
        aria-label="Next brand direction"
        className="identity-switcher__arrow"
        onClick={() => onMove(1)}
        type="button"
      >
        →
      </button>
    </nav>
  );
}
