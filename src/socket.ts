import { io } from "socket.io-client";

const serverUrl =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3001";

export const socket = io(serverUrl, {
  autoConnect: false,
});