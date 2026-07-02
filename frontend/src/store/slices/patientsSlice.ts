import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { patientApi } from "../../api/endpoints.js";
import { extractErrorMessage } from "../../api/client.js";
import type {
  AlertsResponse,
  HistoryResponse,
  PatientListRow,
  PatientProfile,
  PatientSummary,
} from "../../types.js";

interface PatientsState {
  list: PatientListRow[];
  listStatus: "idle" | "loading" | "failed";
  listError: string | null;
  listUpdatedAt: number | null;
  summary: PatientSummary | null;
  history: HistoryResponse | null;
  alerts: AlertsResponse | null;
  profile: PatientProfile | null;
  detailStatus: "idle" | "loading" | "failed";
  detailError: string | null;
}

const initialState: PatientsState = {
  list: [],
  listStatus: "idle",
  listError: null,
  listUpdatedAt: null,
  summary: null,
  history: null,
  alerts: null,
  profile: null,
  detailStatus: "idle",
  detailError: null,
};

// `silent` refreshes (background polling) keep the current table on screen
// instead of flashing the loading state.
export const fetchPatients = createAsyncThunk(
  "patients/list",
  async (_opts: { silent?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const result = await patientApi.list();
      return result.data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

export const fetchPatientDetail = createAsyncThunk(
  "patients/detail",
  async (patientId: string, { rejectWithValue }) => {
    try {
      const [summary, history, alerts, profile] = await Promise.all([
        patientApi.summary(patientId),
        patientApi.history(patientId, 200, "asc"),
        patientApi.alerts(patientId, 25, "desc"),
        patientApi.profile(patientId),
      ]);
      return { summary, history, alerts, profile };
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    clearDetail(state) {
      state.summary = null;
      state.history = null;
      state.alerts = null;
      state.profile = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state, action) => {
        if (!action.meta.arg?.silent) state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.listStatus = "idle";
        state.list = action.payload;
        state.listUpdatedAt = Date.now();
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = (action.payload as string) ?? "Failed to load patients";
      })
      .addCase(fetchPatientDetail.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchPatientDetail.fulfilled, (state, action) => {
        state.detailStatus = "idle";
        state.summary = action.payload.summary;
        state.history = action.payload.history;
        state.alerts = action.payload.alerts;
        state.profile = action.payload.profile;
      })
      .addCase(fetchPatientDetail.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = (action.payload as string) ?? "Failed to load patient";
      });
  },
});

export const { clearDetail } = patientsSlice.actions;
export default patientsSlice.reducer;
