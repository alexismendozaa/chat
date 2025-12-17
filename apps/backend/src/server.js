import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";

import { connectPostgres } from "./src_postgres.js";
import { connectMongo } from "./src_mongo.js";
import jwt from "jsonwebtoken";
import authRoutes from "./auth/auth.routes.js";
import chatRoutes from "./chat/chat.routes.js";
import uploadRoutes from "./uploads/upload.routes.js";
import { Message } from "./mongo/message.model.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"], credentials: true }));
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/health", async (req, res) => {
  res.json({ ok: true, name: "chat-backend", time: new Date().toISOString() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"], credentials: true },
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization?.startsWith("Bearer ")
        ? socket.handshake.headers.authorization.slice(7)
        : null);

    if (!token) return next(new Error("missing token"));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload; // { sub, username, ... }
    next();
  } catch {
    next(new Error("invalid token"));
  }
});

// Socket básico (luego lo conectamos con Mongo para guardar mensajes)
io.on("connection", (socket) => {
  console.log("✅ socket connected:", socket.id);

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    socket.emit("joined", { roomId });
  });

  socket.on("message", async ({ roomId, text, imageUrl }) => {
    if (!roomId || (!text && !imageUrl)) return;

    const msg = await Message.create({
      roomId,
      userId: socket.user.sub,
      username: socket.user.username,
      text,
      imageUrl,
    });

    io.to(roomId).emit("message", {
      id: msg._id,
      roomId: msg.roomId,
      user: msg.username,
      text: msg.text,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt,
    });
  });

  socket.on("disconnect", () => console.log("❌ socket disconnected:", socket.id));
});

const PORT = Number(process.env.PORT || 3000);

(async () => {
  await connectPostgres();
  await connectMongo();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend ready on ${PORT}`);
  });
})();
