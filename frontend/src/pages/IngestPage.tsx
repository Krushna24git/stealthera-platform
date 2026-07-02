import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { resetIngestion, submitHealthData } from "../store/slices/ingestionSlice.js";
import type { IngestPayload } from "../api/endpoints.js";

const deviceKey = import.meta.env.VITE_DEVICE_API_KEY ?? "st-device-key-local";

export default function IngestPage() {
  const dispatch = useAppDispatch();
  const { status, error, lastResult } = useAppSelector((state) => state.ingestion);

  const [form, setForm] = useState({
    deviceId: "ST001",
    patientId: "P1001",
    heartRate: "76",
    spo2: "98",
    temperature: "36.7",
    steps: "5400",
    fallDetected: false,
  });

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // A blank field means "not reported" — omit it so an optional vital stays
  // optional instead of being coerced to 0 and rejected by physiological bounds.
  const optionalNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(resetIngestion());
    const payload: IngestPayload = {
      deviceId: form.deviceId.trim(),
      patientId: form.patientId.trim(),
      timestamp: new Date().toISOString(),
      heartRate: optionalNumber(form.heartRate),
      spo2: optionalNumber(form.spo2),
      temperature: optionalNumber(form.temperature),
      steps: optionalNumber(form.steps),
      fallDetected: form.fallDetected,
    };
    dispatch(submitHealthData({ payload, deviceKey }));
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Simulate Wearable Packet</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Sends POST /api/v1/health-data with the device API key.
      </p>
      <form onSubmit={onSubmit}>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="field">
            <label>Device ID</label>
            <input value={form.deviceId} onChange={(e) => update("deviceId", e.target.value)} required />
          </div>
          <div className="field">
            <label>Patient ID</label>
            <input value={form.patientId} onChange={(e) => update("patientId", e.target.value)} required />
          </div>
          <div className="field">
            <label>Heart Rate (bpm)</label>
            <input value={form.heartRate} onChange={(e) => update("heartRate", e.target.value)} type="number" />
          </div>
          <div className="field">
            <label>SpO₂ (%)</label>
            <input value={form.spo2} onChange={(e) => update("spo2", e.target.value)} type="number" />
          </div>
          <div className="field">
            <label>Temperature (°C)</label>
            <input
              value={form.temperature}
              onChange={(e) => update("temperature", e.target.value)}
              type="number"
              step="0.1"
            />
          </div>
          <div className="field">
            <label>Steps</label>
            <input value={form.steps} onChange={(e) => update("steps", e.target.value)} type="number" />
          </div>
        </div>
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={form.fallDetected}
              onChange={(e) => update("fallDetected", e.target.checked)}
            />{" "}
            Fall detected
          </label>
        </div>
        <button className="btn" disabled={status === "loading"}>
          {status === "loading" ? "Sending..." : "Send packet"}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {lastResult && (
        <div style={{ marginTop: 16 }}>
          <span className={`badge ${lastResult.status === "stored" ? "ok" : "warning"}`}>
            {lastResult.status}
          </span>
          {lastResult.data.alerts.length > 0 ? (
            <ul style={{ marginTop: 10 }}>
              {lastResult.data.alerts.map((a, i) => (
                <li key={i}>
                  <span className={`badge ${a.severity}`}>{a.type}</span> {a.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted" style={{ marginTop: 10 }}>
              {lastResult.status === "duplicate" ? "Duplicate packet ignored." : "No alerts triggered."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
