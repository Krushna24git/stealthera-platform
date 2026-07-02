export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Vitals {
  recordId: string;
  deviceId: string;
  patientId: string;
  timestamp: string;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  steps: number | null;
  fallDetected: boolean;
}

export interface Alert {
  id: string;
  patientId: string;
  deviceId: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metric: string | null;
  value: number | null;
  threshold: number | null;
  timestamp: string;
}

export interface RecoveryScore {
  score: number;
  band: "poor" | "fair" | "good" | "excellent";
  factors: string[];
}

export interface PatientSummary {
  patientId: string;
  latestVitals: Vitals | null;
  averages: { heartRate: number | null; spo2: number | null };
  totals: { steps: number };
  sampleCount: number;
  window: { firstAt: string | null; lastAt: string | null };
  latestAlert: Alert | null;
  recoveryScore: RecoveryScore;
}

export interface PatientListRow {
  patientId: string;
  name: string;
  sex: string;
  deviceIds: string[];
  latest: Vitals | null;
  latestAlert: Alert | null;
}

export interface Genetics {
  cardiacRisk: string;
  diabetesRisk: string;
}

export interface PatientProfile {
  patientId: string;
  demographics: { name: string; sex: string; dateOfBirth: string | null } | null;
  wearable: PatientSummary;
  genetics: { available: boolean; source: string; data: Genetics | null; note?: string };
}

export interface HistoryResponse {
  patientId: string;
  count: number;
  total: number;
  data: Vitals[];
}

export interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface IngestionResult {
  status: "stored" | "duplicate";
  data: {
    created: boolean;
    recordId: string;
    patientId: string;
    deviceId: string;
    timestamp: string;
    alerts: Array<{ type: string; severity: string; message: string }>;
  };
}
