import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { Message } from "../mongo/message.model.js";

const r = Router();

r.get("/rooms/:roomId/messages", requireAuth, async (req, res) => {
  const { roomId } = req.params;

  const messages = await Message.find({ roomId })
    .sort({ createdAt: 1 })
    .limit(100);

  res.json(messages);
});

export default r;
