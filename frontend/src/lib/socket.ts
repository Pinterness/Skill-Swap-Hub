import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

// Tạo 1 kết nối socket duy nhất dùng chung cho toàn app,
// tránh việc mỗi component tự tạo 1 connection riêng gây lãng phí
// Deploy config: socket origin comes from VITE_SOCKET_URL.
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket"],
});
