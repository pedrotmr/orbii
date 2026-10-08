// Three visual identity directions, switchable via ?variant=A|B|C on this throwaway route.
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
}

const DIRECTIONS = [
  {
    direction: "A",
    name: "Return loop",
    description:
      "One open loop for the daily return, drawn as a single confident stroke.",
  },
  {
    direction: "B",
    name: "Focus pair",
    description:
      "Two upright strokes echo the double i in Orbii and the small set chosen for today.",
  },
  {
    direction: "C",
    name: "Focus window",
    description:
      "Open corners frame one coral choice: a quiet sign for giving a few habits your attention.",
  },
] as const satisfies readonly DirectionDetails[];

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
    <main className="identity-prototype">
      <div className="identity-prototype__inner">
        <header className="identity-header">
          <div className="identity-header__copy">
            <p className="identity-header__label">Orbii · visual identity</p>
            <h1>Make Orbii easy to spot.</h1>
            <p>
              Three directions for the mark and wordmark, shown in the app icon,
              sign-in, and splash. Use the arrows or ← / → to compare.
            </p>
          </div>
          <aside className="identity-palette" aria-label="Current color tokens">
            <p>Colors held steady</p>
            <div className="identity-palette__swatches">
              <span
                className="identity-swatch identity-swatch--mist"
                title="Mist background"
              />
              <span
                className="identity-swatch identity-swatch--coral"
                title="Coral primary"
              />
              <span
                className="identity-swatch identity-swatch--teal"
                title="Teal accent"
              />
              <span>Current tokens</span>
            </div>
            <small>
              Palette changes can be decided after choosing a direction.
            </small>
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
              <h3>Sign-in screen</h3>
              <span>Current welcome copy</span>
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
                <p>
                  Good habits.
                  <br />A little at a time.
                </p>
              </div>
              <div className="identity-splash__foot">
                A little focus, every day
              </div>
            </div>
          </article>
        </section>

        <section className="identity-question" aria-label="Review questions">
          <p>
            <strong>Your call:</strong> Which direction should Orbii use?
          </p>
          <p>
            Should the existing Mist, Coral, and Teal color tokens stay as they
            are?
          </p>
        </section>
      </div>

      <BrandIdentitySwitcher
        direction={direction}
        name={selected.name}
        onMove={move}
      />
    </main>
  );
}
