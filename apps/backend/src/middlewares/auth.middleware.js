import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    const token = h.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "invalid token" });
  }
}
