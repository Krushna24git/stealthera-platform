import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { patientApi } from "../../api/endpoints.js";
import { extractErrorMessage } from "../../api/client.js";
import type { HistoryResponse, PatientListRow, PatientProfile, PatientSummary } from "../../types.js";

interface PatientsState {
  list: PatientListRow[];
  listStatus: "idle" | "loading" | "failed";
  listError: string | null;
  summary: PatientSummary | null;
  history: HistoryResponse | null;
  profile: PatientProfile | null;
  detailStatus: "idle" | "loading" | "failed";
  detailError: string | null;
}

const initialState: PatientsState = {
  list: [],
  listStatus: "idle",
  listError: null,
  summary: null,
  history: null,
  profile: null,
  detailStatus: "idle",
  detailError: null,
};

export const fetchPatients = createAsyncThunk("patients/list", async (_: void, { rejectWithValue }) => {
  try {
    const result = await patientApi.list();
    return result.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const fetchPatientDetail = createAsyncThunk(
  "patients/detail",
  async (patientId: string, { rejectWithValue }) => {
    try {
      const [summary, history, profile] = await Promise.all([
        patientApi.summary(patientId),
        patientApi.history(patientId, 200, "asc"),
        patientApi.profile(patientId),
      ]);
      return { summary, history, profile };
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
      state.profile = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.listStatus = "idle";
        state.list = action.payload;
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
