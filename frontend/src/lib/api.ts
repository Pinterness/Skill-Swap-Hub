import axios from "axios";

// Deploy config: central axios client for Vercel + Render API routing.
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

export default api;
