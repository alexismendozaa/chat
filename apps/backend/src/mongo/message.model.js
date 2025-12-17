import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    text: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
