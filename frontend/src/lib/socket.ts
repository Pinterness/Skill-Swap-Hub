import { io } from "socket.io-client";

// Tạo 1 kết nối socket duy nhất dùng chung cho toàn app,
// tránh việc mỗi component tự tạo 1 connection riêng gây lãng phí
// Deploy config: socket origin comes from VITE_SOCKET_URL.
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ["websocket"],
});

export default socket;
