import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.error("No token provided in headers");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message, err.stack);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};