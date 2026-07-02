import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { loginThunk } from "../store/slices/authSlice.js";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("admin@stealthera.health");
  const [password, setPassword] = useState("StealthEra");

  // Already authenticated (e.g. deep-linked to /login with a live session).
  if (token) return <Navigate to="/" replace />;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await dispatch(loginThunk({ email: email.trim(), password }));
    if (loginThunk.fulfilled.match(result)) navigate("/", { replace: true });
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1>StealthEra</h1>
            <p className="muted">Remote patient monitoring</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-block" disabled={status === "loading"}>
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
        <p className="muted footnote">Demo credentials are pre-filled for the seeded admin user.</p>
      </form>
    </div>
  );
}
