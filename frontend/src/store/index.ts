import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import patientsReducer from "./slices/patientsSlice.js";
import ingestionReducer from "./slices/ingestionSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patients: patientsReducer,
    ingestion: ingestionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
