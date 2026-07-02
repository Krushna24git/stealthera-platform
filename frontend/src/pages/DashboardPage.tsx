import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { fetchPatients } from "../store/slices/patientsSlice.js";
import StatTile from "../components/StatTile.js";
import SeverityBadge from "../components/SeverityBadge.js";
import { SkeletonRows } from "../components/Skeleton.js";
import { timeAgo } from "../utils/format.js";

const REFRESH_INTERVAL_MS = 30_000;

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list, listStatus, listError, listUpdatedAt } = useAppSelector((state) => state.patients);
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchPatients(undefined));
    const timer = setInterval(() => dispatch(fetchPatients({ silent: true })), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [dispatch]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.patientId.toLowerCase().includes(needle) ||
        row.deviceIds.some((id) => id.toLowerCase().includes(needle))
    );
  }, [list, query]);

  const stats = useMemo(() => {
    const devices = new Set(list.flatMap((row) => row.deviceIds));
    const critical = list.filter((row) => row.latestAlert?.severity === "critical").length;
    const warning = list.filter((row) => row.latestAlert?.severity === "warning").length;
    return { patients: list.length, devices: devices.size, critical, warning };
  }, [list]);

  const loading = listStatus === "loading";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Patients</h1>
          <p className="muted">
            Live vitals from wearable devices
            {listUpdatedAt && ` · updated ${timeAgo(new Date(listUpdatedAt).toISOString())}`}
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => dispatch(fetchPatients(undefined))}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-tiles">
        <StatTile label="Monitored patients" value={loading ? "…" : stats.patients} />
        <StatTile label="Active devices" value={loading ? "…" : stats.devices} />
        <StatTile
          label="Critical alerts"
          value={loading ? "…" : stats.critical}
          tone={stats.critical > 0 ? "critical" : "ok"}
          sub={stats.critical > 0 ? "latest alert is critical" : "all clear"}
        />
        <StatTile
          label="Warnings"
          value={loading ? "…" : stats.warning}
          tone={stats.warning > 0 ? "warning" : "default"}
          sub="latest alert is a warning"
        />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Patient list</h2>
          <input
            className="search-input"
            type="search"
            placeholder="Search name, patient or device ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>

        {listError && <p className="error-text">{listError}</p>}

        {!listError && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Devices</th>
                  <th>Heart rate</th>
                  <th>SpO₂</th>
                  <th>Temp</th>
                  <th>Last alert</th>
                  <th>Updated</th>
                </tr>
              </thead>
              {loading ? (
                <SkeletonRows rows={5} columns={7} />
              ) : (
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          {list.length === 0 ? (
                            <>
                              <strong>No patients yet</strong>
                              <span className="muted">
                                Seed the database (<code>npm run seed</code>) or send a packet from
                                Device Simulator.
                              </span>
                            </>
                          ) : (
                            <span className="muted">No patients match “{query}”.</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((row) => (
                    <tr
                      key={row.patientId}
                      className={`row-link${row.latestAlert?.severity === "critical" ? " row-critical" : ""}`}
                      tabIndex={0}
                      onClick={() => navigate(`/patients/${row.patientId}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate(`/patients/${row.patientId}`);
                      }}
                    >
                      <td>
                        <strong>{row.name || row.patientId}</strong>
                        <div className="muted mono">{row.patientId}</div>
                      </td>
                      <td className="mono">{row.deviceIds.join(", ") || "—"}</td>
                      <td className="num">
                        {row.latest?.heartRate ?? "—"}
                        {row.latest?.heartRate != null && <span className="unit"> bpm</span>}
                      </td>
                      <td className="num">
                        {row.latest?.spo2 ?? "—"}
                        {row.latest?.spo2 != null && <span className="unit"> %</span>}
                      </td>
                      <td className="num">
                        {row.latest?.temperature ?? "—"}
                        {row.latest?.temperature != null && <span className="unit"> °C</span>}
                      </td>
                      <td>
                        <SeverityBadge
                          severity={row.latestAlert?.severity}
                          type={row.latestAlert?.type}
                        />
                      </td>
                      <td className="muted">{row.latest ? timeAgo(row.latest.timestamp) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
