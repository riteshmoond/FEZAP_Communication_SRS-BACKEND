const sendMail = require("../utils/sendMail");

const sendEmail = async (req, res) => {
  try {
 
    const { to, subject, message } = req.body;

    // ✅ validation
    if (!to || !subject || !message) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields: ["to", "subject", "message"].filter(
          field => !req.body[field]
        ),
      });
    }

    // ✅ send mail
    await sendMail({
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    res.json({
      message: "Email sent successfully ✅",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to send email",
    });
  }
};

module.exports = { sendEmail };