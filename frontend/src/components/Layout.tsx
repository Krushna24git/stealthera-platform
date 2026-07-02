import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { logout } from "../store/slices/authSlice.js";

// The API docs live on the backend origin. When the app talks to the API via
// a relative path (dev proxy / nginx), the docs are not proxied, so fall back
// to the conventional local backend address.
function docsUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
  if (/^https?:\/\//.test(base)) return new URL("/docs", base).toString();
  return "http://localhost:4000/docs";
}

function initials(nameOrEmail: string): string {
  const source = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Layout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const identity = user?.name || user?.email || "";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>StealthEra</span>
        </div>
        <nav aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Patients
          </NavLink>
          <NavLink to="/ingest" className={({ isActive }) => (isActive ? "active" : "")}>
            Device simulator
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <a href={docsUrl()} target="_blank" rel="noreferrer">
            API docs ↗
          </a>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="muted">Remote patient monitoring</span>
          <div className="topbar-user">
            {identity && (
              <>
                <span className="avatar" aria-hidden="true">
                  {initials(identity)}
                </span>
                <span className="muted">{identity}</span>
              </>
            )}
            <button className="btn btn-ghost" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
