import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

type DiceResult =
  | "sword"
  | "sparkles"
  | "shield"
  | "shield-alert"
  | "blank";

type Room = {
  code: string;
  players: string[];
};

const rooms: Record<string, Room> = {};

function createRoomCode() {
  let code = "";

  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms[code]);

  return code;
}

function createResults(
  rollType: "attack" | "defense",
  diceCount: number
): DiceResult[] {
  const attackFaces: DiceResult[] = [
    "sword",
    "sword",
    "sword",
    "blank",
    "blank",
    "sparkles",
  ];

  const defenseFaces: DiceResult[] = [
    "shield",
    "shield",
    "shield",
    "blank",
    "blank",
    "shield-alert",
  ];

  const faces =
    rollType === "attack"
      ? attackFaces
      : defenseFaces;

  return Array.from(
    { length: diceCount },
    () => faces[Math.floor(Math.random() * faces.length)]
  );
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("create-room", () => {
    const code = createRoomCode();

    rooms[code] = {
      code,
      players: [socket.id],
    };

    socket.join(code);

    socket.emit("room-created", {
      roomCode: code,
      players: rooms[code].players,
    });

    console.log("Room created:", code);
  });

  socket.on("join-room", (roomCode: string) => {
    const code = roomCode.trim().toUpperCase();
    const room = rooms[code];

    if (!room) {
      socket.emit("join-error", "Room not found");
      return;
    }

    if (room.players.length >= 8) {
      socket.emit("join-error", "Room is full");
      return;
    }

    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    socket.join(code);

    io.to(code).emit("room-updated", {
      roomCode: code,
      players: room.players,
    });

    console.log(socket.id, "joined room", code);
  });

  socket.on(
    "roll-dice",
    ({
      roomCode,
      rollType,
      diceCount,
      playerName,
    }: {
      roomCode: string;
      rollType: "attack" | "defense";
      diceCount: number;
      playerName: string;
    }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms[code];

      if (!room) return;
      if (!room.players.includes(socket.id)) return;

      const safeDiceCount = Math.max(
        1,
        Math.min(10, Number(diceCount))
      );

      const results = createResults(
        rollType,
        safeDiceCount
      );

      const rollId = crypto.randomUUID();

      const rollData = {
        rollId,
        roomCode: code,
        rollType,
        diceCount: safeDiceCount,
        results,
        playerName: playerName.trim() || "Player",
      };

      const log = {
        id: rollId,
        roomId: code,
        playerId: socket.id,
        time: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        playerName: playerName.trim() || "Player",
        diceType: rollType === "attack" ? "ATK" : "DEF",
        results,
      };

      // เริ่มทอยพร้อมกันทุกคน
      io.to(code).emit("roll-started", rollData);

      // ส่ง Log ไปทุกคน แต่ Client จะเก็บไว้ก่อน
      io.to(code).emit("log-added", log);
    }
  );

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    for (const code in rooms) {
      rooms[code].players =
        rooms[code].players.filter(
          (id) => id !== socket.id
        );

      if (rooms[code].players.length === 0) {
        delete rooms[code];
        continue;
      }

      io.to(code).emit("room-updated", {
        roomCode: code,
        players: rooms[code].players,
      });
    }
  });
});

server.listen(3001, () => {
  console.log(
    "Server running on http://localhost:3001"
  );
});