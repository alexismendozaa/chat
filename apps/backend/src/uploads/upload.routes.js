import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middlewares/auth.middleware.js";

const r = Router();

r.post("/image", requireAuth, async (req, res) => {
  const { contentType } = req.body;
  if (!contentType?.startsWith("image/")) {
    return res.status(400).json({ error: "invalid file type" });
  }

  const ext = contentType.split("/")[1];
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  const uploadUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  const publicUrl = uploadUrl;

  res.json({ uploadUrl, publicUrl });
});

export default r;
