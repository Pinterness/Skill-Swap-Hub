// Deploy config: keep runtime URLs in Vite env vars instead of fixed local URLs.
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_URL = trimTrailingSlash(import.meta.env.VITE_API_URL ?? "");
export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL ?? "",
);
