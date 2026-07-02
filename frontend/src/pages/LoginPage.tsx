import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { loginThunk } from "../store/slices/authSlice.js";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("admin@stealthera.health");
  const [password, setPassword] = useState("StealthEra");

  if (token) {
    navigate("/", { replace: true });
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) navigate("/", { replace: true });
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h1 style={{ marginTop: 0 }}>StealthEra RPM</h1>
        <p className="muted" style={{ marginTop: -8 }}>
          Clinician sign in
        </p>
        <div className="field">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button
          className="btn"
          style={{ width: "100%" }}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
