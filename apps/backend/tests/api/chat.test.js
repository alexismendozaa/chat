import request from "supertest";
import app from "../testApp.js";

let token;

beforeAll(async () => {
  const r = await request(app)
    .post("/auth/login")
    .send({ username: "testuser", password: "123456" });

  token = r.body.token;
});

it("gets room messages", async () => {
  const r = await request(app)
    .get("/api/chat/rooms/general/messages")
    .set("Authorization", `Bearer ${token}`);

  expect(r.statusCode).toBe(200);
  expect(Array.isArray(r.body)).toBe(true);
});
