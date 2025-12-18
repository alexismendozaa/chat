import express from "express";
import chatRoutes from "../src/chat/chat.routes";

const app = express();
app.use(express.json());
app.use("/chat", chatRoutes);

export default app;
