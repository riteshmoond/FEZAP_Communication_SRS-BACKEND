const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { sendEmail, sendMailByKey } = require("../controllers/mailController");

router.post("/send-mail", authMiddleware, sendEmail);
// router.post("/send-mail-by-key",authMiddleware, sendMailByKey);

module.exports = router;