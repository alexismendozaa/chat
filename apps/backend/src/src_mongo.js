import mongoose from "mongoose";

export async function connectMongo() {
  if (!process.env.MONGO_URL) throw new Error("❌ Missing MONGO_URL");
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Mongo connected:", mongoose.connection.name);
}
