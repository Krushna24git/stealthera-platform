import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { clearDetail, fetchPatientDetail } from "../store/slices/patientsSlice.js";
import type { Vitals } from "../types.js";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values, max);
  return (
    <div className="spark">
      {values.map((v, i) => (
        <span
          key={i}
          style={{ height: `${((v - min) / Math.max(1, max - min)) * 100}%` }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

function bandColor(band: string): string {
  if (band === "excellent" || band === "good") return "var(--ok)";
  if (band === "fair") return "var(--warning)";
  return "var(--critical)";
}

export default function PatientDetailPage() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const { summary, history, profile, detailStatus, detailError } = useAppSelector(
    (state) => state.patients
  );

  useEffect(() => {
    dispatch(fetchPatientDetail(id));
    return () => {
      dispatch(clearDetail());
    };
  }, [dispatch, id]);

  if (detailStatus === "loading") return <p className="muted">Loading patient {id}...</p>;
  if (detailError) return <p className="error-text">{detailError}</p>;
  if (!summary || !profile) return null;

  const hrSeries = (history?.data ?? [])
    .map((v: Vitals) => v.heartRate)
    .filter((n): n is number => typeof n === "number");
  const recovery = summary.recoveryScore;

  return (
    <div>
      <p>
        <Link to="/">← Patients</Link>
      </p>
      <h2 style={{ marginTop: 0 }}>
        {profile.demographics?.name || id} <span className="muted">({id})</span>
      </h2>

      <div className="grid grid-tiles" style={{ marginBottom: 18 }}>
        <div className="tile">
          <div className="label">Heart Rate</div>
          <div className="value">{summary.latestVitals?.heartRate ?? "—"}</div>
          <div className="muted">avg {summary.averages.heartRate ?? "—"} bpm</div>
        </div>
        <div className="tile">
          <div className="label">SpO₂</div>
          <div className="value">{summary.latestVitals?.spo2 ?? "—"}</div>
          <div className="muted">avg {summary.averages.spo2 ?? "—"} %</div>
        </div>
        <div className="tile">
          <div className="label">Temperature</div>
          <div className="value">{summary.latestVitals?.temperature ?? "—"}</div>
          <div className="muted">°C</div>
        </div>
        <div className="tile">
          <div className="label">Total Steps</div>
          <div className="value">{summary.totals.steps}</div>
          <div className="muted">{summary.sampleCount} samples</div>
        </div>
      </div>

      <div className="card">
        <h2>Recovery Score</h2>
        <div className="bar">
          <strong style={{ fontSize: 26 }}>{recovery.score}</strong>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${recovery.score}%`, background: bandColor(recovery.band) }}
            />
          </div>
          <span className={`badge ${recovery.band === "poor" ? "critical" : "ok"}`}>{recovery.band}</span>
        </div>
        {recovery.factors.length > 0 && (
          <ul className="muted" style={{ marginBottom: 0 }}>
            {recovery.factors.map((factor, i) => (
              <li key={i}>{factor}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="card">
          <h2>Heart Rate Trend</h2>
          {hrSeries.length > 0 ? <Sparkline values={hrSeries} /> : <p className="muted">No data</p>}
        </div>
        <div className="card">
          <h2>Genetic Risk (Partner)</h2>
          {profile.genetics.available && profile.genetics.data ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Cardiac: <strong>{profile.genetics.data.cardiacRisk}</strong></li>
              <li>Diabetes: <strong>{profile.genetics.data.diabetesRisk}</strong></li>
            </ul>
          ) : (
            <p className="muted">{profile.genetics.note ?? "Unavailable"}</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Latest Alert</h2>
        {summary.latestAlert ? (
          <div className="bar">
            <span className={`badge ${summary.latestAlert.severity}`}>{summary.latestAlert.type}</span>
            <span>{summary.latestAlert.message}</span>
            <span className="muted">{new Date(summary.latestAlert.timestamp).toLocaleString()}</span>
          </div>
        ) : (
          <p className="muted">No alerts recorded.</p>
        )}
      </div>

      <div className="card">
        <h2>History ({history?.count ?? 0} of {history?.total ?? 0})</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>HR</th>
                <th>SpO₂</th>
                <th>Temp</th>
                <th>Steps</th>
                <th>Fall</th>
              </tr>
            </thead>
            <tbody>
              {(history?.data ?? [])
                .slice()
                .reverse()
                .map((v) => (
                  <tr key={v.recordId}>
                    <td className="muted">{new Date(v.timestamp).toLocaleString()}</td>
                    <td>{v.heartRate ?? "—"}</td>
                    <td>{v.spo2 ?? "—"}</td>
                    <td>{v.temperature ?? "—"}</td>
                    <td>{v.steps ?? "—"}</td>
                    <td>{v.fallDetected ? <span className="badge critical">yes</span> : "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
