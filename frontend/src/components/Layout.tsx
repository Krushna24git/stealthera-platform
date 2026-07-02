import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { logout } from "../store/slices/authSlice.js";

export default function Layout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>StealthEra RPM</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Patients
          </NavLink>
          <NavLink to="/ingest" className={({ isActive }) => (isActive ? "active" : "")}>
            Simulate Device
          </NavLink>
          <a href="/api/v1/health" target="_blank" rel="noreferrer">
            API Health
          </a>
          <a href="http://localhost:4000/docs" target="_blank" rel="noreferrer">
            API Docs
          </a>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="muted">Remote Patient Monitoring</span>
          <div className="bar" style={{ gap: 14 }}>
            <span className="muted">{user?.email ?? ""}</span>
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
