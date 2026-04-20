// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // user data attach
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;