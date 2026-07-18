import { io } from "socket.io-client";

// Tạo 1 kết nối socket duy nhất dùng chung cho toàn app,
// tránh việc mỗi component tự tạo 1 connection riêng gây lãng phí
export const socket = io("http://localhost:5000", {
  autoConnect: true,
  transports: ["websocket"],
});