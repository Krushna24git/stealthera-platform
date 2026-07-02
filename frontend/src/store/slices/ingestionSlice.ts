import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ingestionApi, type IngestPayload } from "../../api/endpoints.js";
import { extractErrorMessage } from "../../api/client.js";
import type { IngestionResult } from "../../types.js";

interface IngestionState {
  status: "idle" | "loading" | "failed";
  error: string | null;
  lastResult: IngestionResult | null;
}

const initialState: IngestionState = {
  status: "idle",
  error: null,
  lastResult: null,
};

export const submitHealthData = createAsyncThunk(
  "ingestion/submit",
  async (args: { payload: IngestPayload; deviceKey: string }, { rejectWithValue }) => {
    try {
      return await ingestionApi.submit(args.payload, args.deviceKey);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

const ingestionSlice = createSlice({
  name: "ingestion",
  initialState,
  reducers: {
    resetIngestion(state) {
      state.status = "idle";
      state.error = null;
      state.lastResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitHealthData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(submitHealthData.fulfilled, (state, action) => {
        state.status = "idle";
        state.lastResult = action.payload;
      })
      .addCase(submitHealthData.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) ?? "Ingestion failed";
      });
  },
});

export const { resetIngestion } = ingestionSlice.actions;
export default ingestionSlice.reducer;
