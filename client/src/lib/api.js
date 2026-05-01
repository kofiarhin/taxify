import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.VITEST ? "http://localhost:5000/api/v1" : "");

if (!baseURL) {
  throw new Error("Missing VITE_API_URL configuration");
}

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("taxify_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.message = error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(error);
  }
);
