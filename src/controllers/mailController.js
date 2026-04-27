const mailQueue = require("../queues/mailQueue");

const sendEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    // ✅ validation
    if (!to || !subject || !message) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields: ["to", "subject", "message"].filter(
          (field) => !req.body[field]
        ),
      });
    }

    // 🔥 direct send hata diya
    // ❌ await sendMail(...)

    // ✅ queue me daal diya
   await mailQueue.add(
  "sendMailJob",
  {
    to,
    subject,
    message,
  },
  {
    attempts: 3, // 🔥 retry 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // 5 sec gap
    },

    delay: 5000, // 🔥 5 sec baad send
  }
);
    res.json({
      message: "Email queued successfully 🚀",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to queue email",
    });
  }
};

module.exports = { sendEmail };