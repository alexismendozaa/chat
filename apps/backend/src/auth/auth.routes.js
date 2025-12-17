import { Router } from "express";
import { register, login } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const r = Router();

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    req.body = parsed.data;
    next();
  };
}

r.post("/register", validate(registerSchema), register);
r.post("/login", validate(loginSchema), login);

export default r;
