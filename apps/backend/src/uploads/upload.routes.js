import { Router } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { requireAuth } from "../middlewares/auth.middleware.js";

const r = Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

r.post("/image", requireAuth, async (req, res) => {
  const { contentType } = req.body;
  if (!contentType?.startsWith("image/")) {
    return res.status(400).json({ error: "invalid file type" });
  }

  const ext = contentType.split("/")[1];
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  res.json({ uploadUrl, publicUrl });
});

export default r;
