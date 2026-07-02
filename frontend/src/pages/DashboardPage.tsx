import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { fetchPatients } from "../store/slices/patientsSlice.js";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { list, listStatus, listError } = useAppSelector((state) => state.patients);

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  return (
    <div>
      <div className="card">
        <h2>Monitored Patients</h2>
        {listStatus === "loading" && <p className="muted">Loading...</p>}
        {listError && <p className="error-text">{listError}</p>}
        {listStatus !== "loading" && !listError && (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Devices</th>
                <th>Heart Rate</th>
                <th>SpO₂</th>
                <th>Temp (°C)</th>
                <th>Last Alert</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No patients yet. Seed the database or use Simulate Device.
                  </td>
                </tr>
              )}
              {list.map((row) => (
                <tr
                  key={row.patientId}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/patients/${row.patientId}`)}
                >
                  <td>
                    <strong>{row.name || row.patientId}</strong>
                    <div className="muted">{row.patientId}</div>
                  </td>
                  <td>{row.deviceIds.join(", ") || "—"}</td>
                  <td>{row.latest?.heartRate ?? "—"}</td>
                  <td>{row.latest?.spo2 ?? "—"}</td>
                  <td>{row.latest?.temperature ?? "—"}</td>
                  <td>
                    {row.latestAlert ? (
                      <span className={`badge ${row.latestAlert.severity}`}>{row.latestAlert.type}</span>
                    ) : (
                      <span className="badge ok">none</span>
                    )}
                  </td>
                  <td className="muted">
                    {row.latest ? new Date(row.latest.timestamp).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
