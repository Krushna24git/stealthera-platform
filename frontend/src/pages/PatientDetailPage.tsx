import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { clearDetail, fetchPatientDetail } from "../store/slices/patientsSlice.js";
import TrendChart, { type TrendPoint } from "../components/TrendChart.js";
import StatTile from "../components/StatTile.js";
import SeverityBadge from "../components/SeverityBadge.js";
import { Skeleton } from "../components/Skeleton.js";
import { ageFrom, formatDateTime, formatNumber, timeAgo } from "../utils/format.js";
import type { Vitals } from "../types.js";

// Categorical slots validated against the white card surface (see README
// design notes); status colours stay reserved for alert severity.
const SERIES = {
  heartRate: "#2a78d6",
  spo2: "#1baf7a",
  temperature: "#4a3aa7",
};

function series(history: Vitals[], key: "heartRate" | "spo2" | "temperature"): TrendPoint[] {
  return history
    .filter((v): v is Vitals & Record<typeof key, number> => typeof v[key] === "number")
    .map((v) => ({ t: new Date(v.timestamp).getTime(), value: v[key] as number }));
}

function bandTone(band: string): "ok" | "warning" | "critical" {
  if (band === "excellent" || band === "good") return "ok";
  if (band === "fair") return "warning";
  return "critical";
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton width={220} height={26} style={{ marginBottom: 16 }} />
      <div className="grid grid-tiles" style={{ marginBottom: 18 }}>
        {[0, 1, 2, 3].map((i) => (
          <div className="tile" key={i}>
            <Skeleton width="55%" />
            <Skeleton width="40%" height={26} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="card">
        <Skeleton width="30%" style={{ marginBottom: 14 }} />
        <Skeleton height={120} />
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const { summary, history, alerts, profile, detailStatus, detailError } = useAppSelector(
    (state) => state.patients
  );

  useEffect(() => {
    dispatch(fetchPatientDetail(id));
    return () => {
      dispatch(clearDetail());
    };
  }, [dispatch, id]);

  const charts = useMemo(() => {
    const data = history?.data ?? [];
    return {
      heartRate: series(data, "heartRate"),
      spo2: series(data, "spo2"),
      temperature: series(data, "temperature"),
    };
  }, [history]);

  if (detailStatus === "loading") return <DetailSkeleton />;
  if (detailError) {
    return (
      <div className="card">
        <p className="error-text">{detailError}</p>
        <Link to="/">← Back to patients</Link>
      </div>
    );
  }
  if (!summary || !profile) return null;

  const demographics = profile.demographics;
  const age = ageFrom(demographics?.dateOfBirth ?? null);
  const recovery = summary.recoveryScore;
  const latest = summary.latestVitals;

  return (
    <div>
      <nav className="breadcrumb">
        <Link to="/">Patients</Link>
        <span>/</span>
        <span>{demographics?.name || id}</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>{demographics?.name || id}</h1>
          <p className="muted">
            <span className="mono">{id}</span>
            {demographics?.sex && demographics.sex !== "unknown" && ` · ${demographics.sex}`}
            {age !== null && ` · ${age} yrs`}
            {latest && ` · last reading ${timeAgo(latest.timestamp)}`}
          </p>
        </div>
        <SeverityBadge severity={summary.latestAlert?.severity} type={summary.latestAlert?.type} />
      </div>

      <div className="grid grid-tiles">
        <StatTile
          label="Heart rate"
          value={
            latest?.heartRate != null ? (
              <>
                {latest.heartRate} <span className="unit">bpm</span>
              </>
            ) : (
              "—"
            )
          }
          sub={`avg ${summary.averages.heartRate ?? "—"} bpm`}
        />
        <StatTile
          label="SpO₂"
          value={
            latest?.spo2 != null ? (
              <>
                {latest.spo2} <span className="unit">%</span>
              </>
            ) : (
              "—"
            )
          }
          sub={`avg ${summary.averages.spo2 ?? "—"} %`}
        />
        <StatTile
          label="Temperature"
          value={
            latest?.temperature != null ? (
              <>
                {latest.temperature} <span className="unit">°C</span>
              </>
            ) : (
              "—"
            )
          }
          sub={latest ? `taken ${timeAgo(latest.timestamp)}` : "no reading"}
        />
        <StatTile
          label="Steps"
          value={formatNumber(summary.totals.steps)}
          sub={`${formatNumber(summary.sampleCount)} samples total`}
        />
      </div>

      <div className="detail-columns">
        <div>
          <div className="card">
            <div className="card-head">
              <h2>Heart rate</h2>
              <span className="muted">last {charts.heartRate.length} readings</span>
            </div>
            <TrendChart points={charts.heartRate} color={SERIES.heartRate} unit="bpm" />
          </div>
          <div className="card">
            <div className="card-head">
              <h2>SpO₂</h2>
              <span className="muted">last {charts.spo2.length} readings</span>
            </div>
            <TrendChart points={charts.spo2} color={SERIES.spo2} unit="%" />
          </div>
          <div className="card">
            <div className="card-head">
              <h2>Temperature</h2>
              <span className="muted">last {charts.temperature.length} readings</span>
            </div>
            <TrendChart points={charts.temperature} color={SERIES.temperature} unit="°C" decimals={1} />
          </div>
        </div>

        <div>
          <div className="card">
            <h2>Recovery score</h2>
            <div className="recovery">
              <span className="recovery-score">{recovery.score}</span>
              <div className="bar-track">
                <div className={`bar-fill fill-${bandTone(recovery.band)}`} style={{ width: `${recovery.score}%` }} />
              </div>
              <span className={`badge ${bandTone(recovery.band) === "ok" ? "ok" : bandTone(recovery.band)}`}>
                {recovery.band}
              </span>
            </div>
            {recovery.factors.length > 0 ? (
              <ul className="factor-list">
                {recovery.factors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ marginBottom: 0 }}>
                No detractors — vitals are within the resting bands.
              </p>
            )}
          </div>

          <div className="card">
            <h2>Genetic risk</h2>
            {profile.genetics.available && profile.genetics.data ? (
              <dl className="kv">
                <div>
                  <dt>Cardiac</dt>
                  <dd>
                    <span className={`badge risk-${profile.genetics.data.cardiacRisk.toLowerCase()}`}>
                      {profile.genetics.data.cardiacRisk}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Diabetes</dt>
                  <dd>
                    <span className={`badge risk-${profile.genetics.data.diabetesRisk.toLowerCase()}`}>
                      {profile.genetics.data.diabetesRisk}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="muted" style={{ marginBottom: 0 }}>
                {profile.genetics.note ?? "Partner service unavailable."}
              </p>
            )}
            <p className="muted footnote">Source: partner genetics API</p>
          </div>

          <div className="card">
            <h2>Monitoring</h2>
            <dl className="kv">
              <div>
                <dt>Devices</dt>
                <dd className="mono">{latest?.deviceId ?? "—"}</dd>
              </div>
              <div>
                <dt>First sample</dt>
                <dd>{summary.window.firstAt ? formatDateTime(summary.window.firstAt) : "—"}</dd>
              </div>
              <div>
                <dt>Latest sample</dt>
                <dd>{summary.window.lastAt ? formatDateTime(summary.window.lastAt) : "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Alerts</h2>
          <span className="muted">
            {alerts?.count ?? 0} of {alerts?.total ?? 0}
          </span>
        </div>
        {(alerts?.data.length ?? 0) === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            No alerts recorded for this patient.
          </p>
        ) : (
          <ul className="alert-list">
            {alerts!.data.map((alert) => (
              <li key={alert.id}>
                <SeverityBadge severity={alert.severity} type={alert.type} />
                <span className="alert-message">{alert.message}</span>
                <span className="muted">{formatDateTime(alert.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Reading history</h2>
          <span className="muted">
            {history?.count ?? 0} of {history?.total ?? 0} readings
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>HR (bpm)</th>
                <th>SpO₂ (%)</th>
                <th>Temp (°C)</th>
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
                    <td className="muted">{formatDateTime(v.timestamp)}</td>
                    <td className="num">{v.heartRate ?? "—"}</td>
                    <td className="num">{v.spo2 ?? "—"}</td>
                    <td className="num">{v.temperature ?? "—"}</td>
                    <td className="num">{v.steps != null ? formatNumber(v.steps) : "—"}</td>
                    <td>{v.fallDetected ? <span className="badge critical">fall</span> : "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
