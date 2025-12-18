import { jest } from "@jest/globals";
import request from "supertest";

/* Mock auth */
jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
  requireAuth: (req, res, next) => next(),
}));

/* Mock Mongoose model */
jest.unstable_mockModule("../../src/mongo/message.model.js", () => ({
  Message: {
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        limit: jest.fn().mockResolvedValue([]),
      })),
    })),
  },
}));


const { default: app } = await import("../testApp.js");

it("gets room messages", async () => {
  const r = await request(app).get("/chat/rooms/general/messages");

  expect(r.statusCode).toBe(200);
  expect(Array.isArray(r.body)).toBe(true);
});
