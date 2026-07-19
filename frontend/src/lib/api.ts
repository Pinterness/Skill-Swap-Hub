import axios from "axios";
import dotenv from "dotenv"

// Deploy config: central axios client for Vercel + Render API routing.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
console.log(import.meta.env.VITE_API_URL);
export default api;
