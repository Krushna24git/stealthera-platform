import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { resetIngestion, submitHealthData } from "../store/slices/ingestionSlice.js";
import SeverityBadge from "../components/SeverityBadge.js";
import type { IngestPayload } from "../api/endpoints.js";

const deviceKey = import.meta.env.VITE_DEVICE_API_KEY ?? "st-device-key-local";

interface FormState {
  deviceId: string;
  patientId: string;
  heartRate: string;
  spo2: string;
  temperature: string;
  steps: string;
  fallDetected: boolean;
}

type Scenario = { name: string; hint: string } & Partial<
  Pick<FormState, "heartRate" | "spo2" | "temperature" | "fallDetected">
>;

// Quick vitals presets covering each alert rule, so reviewers can trigger the
// pipeline without memorising thresholds.
const SCENARIOS: Scenario[] = [
  { name: "Normal", hint: "no alerts", heartRate: "76", spo2: "98", temperature: "36.7", fallDetected: false },
  { name: "Tachycardia", hint: "HR > 120", heartRate: "134", spo2: "97", temperature: "36.9", fallDetected: false },
  { name: "Hypoxia", hint: "SpO₂ < 87", heartRate: "92", spo2: "84", temperature: "36.8", fallDetected: false },
  { name: "Fever", hint: "temp > 38 °C", heartRate: "101", spo2: "96", temperature: "38.9", fallDetected: false },
  { name: "Fall", hint: "always critical", heartRate: "88", spo2: "95", temperature: "36.8", fallDetected: true },
];

export default function IngestPage() {
  const dispatch = useAppDispatch();
  const { status, error, lastResult } = useAppSelector((state) => state.ingestion);

  const [form, setForm] = useState<FormState>({
    deviceId: "ST001",
    patientId: "P1001",
    heartRate: "76",
    spo2: "98",
    temperature: "36.7",
    steps: "5400",
    fallDetected: false,
  });

  const update = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyScenario = ({ name: _name, hint: _hint, ...values }: Scenario) =>
    setForm((prev) => ({ ...prev, ...values }));

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
    <div>
      <div className="page-head">
        <div>
          <h1>Device simulator</h1>
          <p className="muted">
            Sends <code>POST /api/v1/health-data</code> signed with the device API key.
          </p>
        </div>
      </div>

      <div className="detail-columns ingest-columns">
        <div className="card">
          <div className="card-head">
            <h2>Packet</h2>
            <div className="scenario-row" role="group" aria-label="Vitals presets">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.name}
                  type="button"
                  className="chip"
                  title={scenario.hint}
                  onClick={() => applyScenario(scenario)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="grid two-col">
              <div className="field">
                <label htmlFor="deviceId">Device ID</label>
                <input
                  id="deviceId"
                  value={form.deviceId}
                  onChange={(e) => update("deviceId", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="patientId">Patient ID</label>
                <input
                  id="patientId"
                  value={form.patientId}
                  onChange={(e) => update("patientId", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="heartRate">Heart rate (bpm)</label>
                <input
                  id="heartRate"
                  value={form.heartRate}
                  onChange={(e) => update("heartRate", e.target.value)}
                  type="number"
                  min={20}
                  max={240}
                />
              </div>
              <div className="field">
                <label htmlFor="spo2">SpO₂ (%)</label>
                <input
                  id="spo2"
                  value={form.spo2}
                  onChange={(e) => update("spo2", e.target.value)}
                  type="number"
                  min={50}
                  max={100}
                />
              </div>
              <div className="field">
                <label htmlFor="temperature">Temperature (°C)</label>
                <input
                  id="temperature"
                  value={form.temperature}
                  onChange={(e) => update("temperature", e.target.value)}
                  type="number"
                  step="0.1"
                  min={30}
                  max={45}
                />
              </div>
              <div className="field">
                <label htmlFor="steps">Steps</label>
                <input
                  id="steps"
                  value={form.steps}
                  onChange={(e) => update("steps", e.target.value)}
                  type="number"
                  min={0}
                />
              </div>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.fallDetected}
                onChange={(e) => update("fallDetected", e.target.checked)}
              />
              Fall detected
            </label>
            <button className="btn" disabled={status === "loading"}>
              {status === "loading" ? "Sending…" : "Send packet"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Result</h2>
          {status === "loading" && <p className="muted">Sending…</p>}
          {error && <p className="error-text">{error}</p>}
          {!error && !lastResult && status !== "loading" && (
            <p className="muted" style={{ marginBottom: 0 }}>
              Send a packet to see the ingestion response and any triggered alerts. Blank vitals are
              omitted from the payload; out-of-range values are rejected with 422.
            </p>
          )}
          {lastResult && (
            <div>
              <p>
                <span className={`badge ${lastResult.status === "stored" ? "ok" : "warning"}`}>
                  {lastResult.status}
                </span>{" "}
                <span className="muted mono">record {lastResult.data.recordId}</span>
              </p>
              {lastResult.data.alerts.length > 0 ? (
                <ul className="alert-list">
                  {lastResult.data.alerts.map((alert, i) => (
                    <li key={i}>
                      <SeverityBadge severity={alert.severity} type={alert.type} />
                      <span className="alert-message">{alert.message}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">
                  {lastResult.status === "duplicate"
                    ? "Duplicate packet — same device and timestamp already stored, nothing written."
                    : "No alert rules triggered."}
                </p>
              )}
              <Link to={`/patients/${lastResult.data.patientId}`}>
                View {lastResult.data.patientId} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
