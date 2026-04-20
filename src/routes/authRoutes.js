// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getMe, logoutUser } = require("../controllers/authController");
const validateRegister = require("../middlewares/validateRegister");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", validateRegister, registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logoutUser);

module.exports = router;