import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const TOKEN_KEY = "stealthera.token";

export const apiClient = axios.create({ baseURL, timeout: 15000 });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on any authenticated call means the session token is missing, invalid
// or expired — clear it and send the user back to sign-in. Login's own 401
// (wrong credentials) must stay on the form, so it is excluded.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("stealthera.user");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: { message?: string } } | undefined;
    return payload?.error?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Unexpected error";
}
