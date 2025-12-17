import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../src_postgres.js";

export async function register(req, res) {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  try {
    const r = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1,$2) RETURNING id, username",
      [username, hash]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "username already exists" });
    }
    throw e;
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  const r = await pool.query(
    "SELECT id, username, password_hash FROM users WHERE username=$1",
    [username]
  );

  if (r.rowCount === 0) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });
}
