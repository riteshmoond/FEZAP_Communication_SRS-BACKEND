const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { sendEmail } = require("../controllers/mailController");

router.post("/send-mail", authMiddleware, sendEmail);

module.exports = router;