import { apiClient } from "./client.js";
import type {
  AlertsResponse,
  AuthUser,
  HistoryResponse,
  IngestionResult,
  Paged,
  PatientListRow,
  PatientProfile,
  PatientSummary,
  Vitals,
} from "../types.js";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<{ token: string; user: AuthUser }>("/auth/login", { email, password })
      .then((r) => r.data),
};

export const patientApi = {
  list: (page = 1, pageSize = 50) =>
    apiClient.get<Paged<PatientListRow>>("/patients", { params: { page, pageSize } }).then((r) => r.data),
  latest: (id: string) => apiClient.get<Vitals>(`/patients/${id}/latest`).then((r) => r.data),
  summary: (id: string) => apiClient.get<PatientSummary>(`/patients/${id}/summary`).then((r) => r.data),
  history: (id: string, limit = 200, order: "asc" | "desc" = "asc") =>
    apiClient
      .get<HistoryResponse>(`/patients/${id}/history`, { params: { limit, order } })
      .then((r) => r.data),
  alerts: (id: string, limit = 25, order: "asc" | "desc" = "desc") =>
    apiClient
      .get<AlertsResponse>(`/patients/${id}/alerts`, { params: { limit, order } })
      .then((r) => r.data),
  profile: (id: string) => apiClient.get<PatientProfile>(`/patient-profile/${id}`).then((r) => r.data),
};

export interface IngestPayload {
  deviceId: string;
  patientId: string;
  timestamp: string;
  heartRate?: number;
  spo2?: number;
  temperature?: number;
  steps?: number;
  fallDetected?: boolean;
}

export const ingestionApi = {
  submit: (payload: IngestPayload, deviceKey: string) =>
    apiClient
      .post<IngestionResult>("/health-data", payload, { headers: { "X-API-Key": deviceKey } })
      .then((r) => r.data),
};
