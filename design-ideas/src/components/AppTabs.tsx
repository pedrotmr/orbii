import { NavLink } from "react-router-dom";

const links = [
  { to: "/today", label: "Today" },
  { to: "/orbit", label: "Orbit" },
  { to: "/settings", label: "More" },
];

export function AppTabs() {
  return (
    <nav className="nav-tabs" aria-label="Main">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? "is-active" : undefined)}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
