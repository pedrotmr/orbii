import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import BrandIdentityLockup from "@/components/BrandIdentityLockup";
import BrandIdentityMark, {
  type BrandDirection,
} from "@/components/BrandIdentityMark";
import BrandIdentitySwitcher from "@/components/BrandIdentitySwitcher";
import "@/screens/brand-identity-prototype.css";

interface DirectionDetails {
  direction: BrandDirection;
  name: string;
  description: string;
  tagline: string;
  palette: readonly PaletteColor[];
}

interface PaletteColor {
  name: string;
  hex: string;
}

const DIRECTIONS = [
  {
    direction: "A",
    name: "Return loop",
    description:
      "One open loop for the daily return, drawn as a single confident stroke.",
    tagline: "Come back to what matters.",
    palette: [
      { name: "Fog", hex: "#F3F6F5" },
      { name: "Pine", hex: "#183D3B" },
      { name: "Coral", hex: "#F06C57" },
      { name: "Teal", hex: "#71B8AD" },
      { name: "White", hex: "#FFFFFF" },
    ],
  },
  {
    direction: "B",
    name: "Focus pair",
    description:
      "Two upright strokes echo the double i in Orbii and the small set chosen for today.",
    tagline: "A little focus, every day.",
    palette: [
      { name: "Midnight", hex: "#15253D" },
      { name: "Warm white", hex: "#F5F3ED" },
      { name: "Sky", hex: "#7AC4D8" },
      { name: "Persimmon", hex: "#F26E4B" },
      { name: "Ink", hex: "#18202A" },
    ],
  },
  {
    direction: "C",
    name: "Focus aperture",
    description:
      "Four open corners frame one choice and leave the rest of life in view.",
    tagline: "Make room for a few.",
    palette: [
      { name: "Chalk", hex: "#F4F0E6" },
      { name: "Cobalt", hex: "#2858D8" },
      { name: "Graphite", hex: "#20242D" },
      { name: "Tangerine", hex: "#EE704E" },
      { name: "Cornflower", hex: "#B8C9F2" },
    ],
  },
  {
    direction: "D",
    name: "Handful",
    description:
      "Five small forms become a chosen handful, with one bright habit lifted forward.",
    tagline: "Choose what fits today.",
    palette: [
      { name: "Evergreen", hex: "#173D34" },
      { name: "Bone", hex: "#F2EEE2" },
      { name: "Citron", hex: "#D7E45A" },
      { name: "Clay", hex: "#D9785D" },
      { name: "Sage", hex: "#A8B9A6" },
    ],
  },
  {
    direction: "E",
    name: "Threshold",
    description:
      "An open doorway and a small step mark the start of a daily ritual.",
    tagline: "Begin with one.",
    palette: [
      { name: "Aubergine", hex: "#29253D" },
      { name: "Porcelain", hex: "#F6F0E5" },
      { name: "Apricot", hex: "#FF865E" },
      { name: "Marigold", hex: "#E7BD52" },
      { name: "Blue gray", hex: "#8297A7" },
    ],
  },
] as const satisfies readonly DirectionDetails[];

const BRANDKIT_IMAGES: Record<BrandDirection, string> = {
  A: new URL("../../screenshots/brandkit-a-return-loop.jpg", import.meta.url)
    .href,
  B: new URL("../../screenshots/brandkit-b-focus-pair.jpg", import.meta.url)
    .href,
  C: new URL("../../screenshots/brandkit-c-focus-aperture.jpg", import.meta.url)
    .href,
  D: new URL("../../screenshots/brandkit-d-handful.jpg", import.meta.url).href,
  E: new URL("../../screenshots/brandkit-e-threshold.jpg", import.meta.url)
    .href,
};

export default function BrandIdentityPrototype() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("variant");
  const selected =
    DIRECTIONS.find(({ direction }) => direction === requested) ??
    DIRECTIONS[0];
  const direction = selected.direction;

  const move = useCallback(
    (offset: number) => {
      const currentIndex = DIRECTIONS.findIndex(
        (item) => item.direction === direction,
      );
      const nextIndex =
        (currentIndex + offset + DIRECTIONS.length) % DIRECTIONS.length;
      setSearchParams(
        { variant: DIRECTIONS[nextIndex].direction },
        { replace: true },
      );
    },
    [direction, setSearchParams],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <main
      className={`identity-prototype identity-prototype--${direction.toLowerCase()}`}
    >
      <div className="identity-prototype__inner">
        <header className="identity-header">
          <div className="identity-header__copy">
            <p className="identity-header__label">Orbii · visual identity</p>
            <h1>Five ways to make Orbii memorable.</h1>
            <p>
              Five distinct brand worlds, shown in the app icon, welcome screen,
              and splash. Use the arrows or ← / → to compare.
            </p>
            <BrandIdentitySwitcher
              direction={direction}
              name={selected.name}
              onMove={move}
            />
          </div>
          <aside
            className="identity-palette"
            aria-label="Explored color palette"
          >
            <p>Palette exploration</p>
            <div className="identity-palette__swatches">
              {selected.palette.map((color) => (
                <div
                  className="identity-palette__color"
                  key={color.name}
                  title={`${color.name} ${color.hex}`}
                >
                  <span
                    className="identity-swatch"
                    style={{ backgroundColor: color.hex }}
                  />
                  <small>{color.hex}</small>
                </div>
              ))}
            </div>
            <small>{selected.name} · five coordinated colors</small>
          </aside>
        </header>

        <section
          aria-labelledby="direction-title"
          className="identity-direction"
        >
          <div className="identity-direction__lockup">
            <BrandIdentityLockup direction={direction} scale="large" />
          </div>
          <div className="identity-direction__copy">
            <p>Direction {direction}</p>
            <h2 id="direction-title">{selected.name}</h2>
            <span>{selected.description}</span>
            <small>{selected.tagline}</small>
          </div>
        </section>

        <section
          aria-label="Brand size and surface previews"
          className="identity-previews"
        >
          <article className="identity-preview identity-preview--icon">
            <header className="identity-preview__heading">
              <h3>App icon</h3>
              <span>60 px</span>
            </header>
            <div className="identity-icon-stage">
              <div className="identity-icon-tile">
                <BrandIdentityMark direction={direction} size={62} />
              </div>
              <span>Orbii</span>
            </div>
            <div className="identity-icon-small-stage">
              <div className="identity-icon-tile identity-icon-tile--small">
                <BrandIdentityMark direction={direction} size={24} />
              </div>
              <p>Also checked at 32 px</p>
            </div>
            <p className="identity-preview__note">
              Silhouette and color separation at a glance.
            </p>
          </article>

          <article className="identity-preview">
            <header className="identity-preview__heading">
              <h3>Welcome screen</h3>
              <span>First impression</span>
            </header>
            <div className="identity-device identity-device--signin">
              <div className="identity-device__status">
                <span>9:41</span>
                <span>•••</span>
              </div>
              <div className="identity-signin__brand">
                <BrandIdentityLockup direction={direction} scale="small" />
              </div>
              <div
                className="identity-signin__illustration"
                aria-label="Examples of small daily habits"
              >
                <div className="identity-habit-example identity-habit-example--walk">
                  <span>↗</span>
                  <div>
                    <strong>A short walk</strong>
                    <small>A little movement</small>
                  </div>
                </div>
                <div className="identity-habit-example identity-habit-example--read">
                  <span>▭</span>
                  <div>
                    <strong>A few pages</strong>
                    <small>A moment for you</small>
                  </div>
                </div>
              </div>
              <div className="identity-signin__copy">
                <h4>
                  Good habits.
                  <br />A little at a time.
                </h4>
                <p>
                  Keep a life full of good things. Make space for just a few
                  each day.
                </p>
              </div>
              <div className="identity-signin__actions">
                <div className="identity-auth-button">
                  <b>●</b> Continue with Apple
                </div>
                <div className="identity-auth-button identity-auth-button--secondary">
                  <b>G</b> Continue with Google
                </div>
              </div>
            </div>
          </article>

          <article className="identity-preview">
            <header className="identity-preview__heading">
              <h3>Splash screen</h3>
              <span>First impression</span>
            </header>
            <div className="identity-device identity-device--splash">
              <div className="identity-device__status">
                <span>9:41</span>
                <span>•••</span>
              </div>
              <div className="identity-splash__center">
                <BrandIdentityLockup direction={direction} scale="splash" />
                <p>{selected.tagline}</p>
              </div>
              <div className="identity-splash__foot">
                A little focus, every day
              </div>
            </div>
          </article>
        </section>

        <section className="identity-brandkit" aria-labelledby="brandkit-title">
          <header className="identity-brandkit__header">
            <div>
              <p>Brandkit board · Direction {direction}</p>
              <h2 id="brandkit-title">{selected.name}</h2>
            </div>
            <span>{selected.tagline}</span>
          </header>
          <figure className="identity-brandkit__figure">
            <img
              alt={`Orbii ${selected.name} brand identity board with logo, app, palette, type, and image direction`}
              src={BRANDKIT_IMAGES[direction]}
            />
            <figcaption>
              Visual concept board · logo geometry is refined separately in the
              app previews above.
            </figcaption>
          </figure>
        </section>

        <section className="identity-question" aria-label="Review questions">
          <p>
            <strong>Your call:</strong> Which identity direction feels most like
            Orbii?
          </p>
          <p>Choose a direction and palette, or combine details across them.</p>
        </section>
      </div>
    </main>
  );
}
