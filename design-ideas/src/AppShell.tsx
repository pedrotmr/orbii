import { NavLink, Outlet, useLocation } from "react-router-dom";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppTabs } from "@/components/AppTabs";
import { useOrbit } from "@/state/orbitStore";

function moodForPath(pathname: string, phase: string) {
  if (phase === "reveal") return "reveal" as const;
  if (phase === "complete" && pathname.startsWith("/today")) return "celebrate" as const;
  return "default" as const;
}

export function AppShell() {
  const location = useLocation();
  const { state } = useOrbit();
  const hideTabs =
    location.pathname === "/" || location.pathname.startsWith("/orbit/setup");

  const mood = moodForPath(location.pathname, state.phase);

  return (
    <div className="app-stage">
      <aside className="demo-rail" aria-label="Prototype navigation">
        <span className="demo-rail__label">Jump</span>
        <NavLink to="/" className={({ isActive }) => `demo-link${isActive ? " is-on" : ""}`} end>
          Welcome
        </NavLink>
        <NavLink
          to="/orbit/setup"
          className={({ isActive }) => `demo-link${isActive ? " is-on" : ""}`}
        >
          Setup Orbit
        </NavLink>
        <NavLink
          to="/today"
          className={({ isActive }) => `demo-link${isActive ? " is-on" : ""}`}
        >
          Today loop
        </NavLink>
        <NavLink
          to="/orbit"
          end
          className={({ isActive }) => `demo-link${isActive ? " is-on" : ""}`}
        >
          Full Orbit
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `demo-link${isActive ? " is-on" : ""}`}
        >
          Settings
        </NavLink>
        <NavLink
          to="/design-system"
          className={({ isActive }) => `demo-link${isActive ? " is-on" : ""}`}
        >
          Design system
        </NavLink>
      </aside>

      <PhoneFrame mood={mood}>
        {!hideTabs ? <AppTabs /> : null}
        <Outlet />
      </PhoneFrame>
    </div>
  );
}
