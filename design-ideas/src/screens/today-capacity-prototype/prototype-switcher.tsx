import { ChevronLeft, ChevronRight } from "lucide-react";

interface PrototypeSwitcherProps {
  current: string;
  label: string;
  onChange: (direction: -1 | 1) => void;
}

export function PrototypeSwitcher({
  current,
  label,
  onChange,
}: PrototypeSwitcherProps) {
  return (
    <nav className="prototype-switcher" aria-label="Capacity prototype variant">
      <button
        type="button"
        aria-label="Previous prototype variant"
        onClick={() => onChange(-1)}
      >
        <ChevronLeft size={17} />
      </button>
      <span>
        {current} — {label}
      </span>
      <button
        type="button"
        aria-label="Next prototype variant"
        onClick={() => onChange(1)}
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
