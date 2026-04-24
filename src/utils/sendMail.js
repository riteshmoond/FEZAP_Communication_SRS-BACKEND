const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendMail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: `"FEZAP" <${process.env.MAIL_USERNAME}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};

module.exports = sendMail;