const mailQueue = require("../queues/mailQueue");

// const sendEmail = async (req, res) => {
//   try {
//     const { to, subject, message } = req.body;

//     // ✅ validation
//     if (!to || !subject || !message) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         missingFields: ["to", "subject", "message"].filter(
//           (field) => !req.body[field]
//         ),
//       });
//     }

//     // 🔥 direct send hata diya
//     // ❌ await sendMail(...)

//     // ✅ queue me daal diya
//    await mailQueue.add(
//   "sendMailJob",
//   {
//     to,
//     subject,
//     message,
//   },
//   {
//     attempts: 3, // 🔥 retry 3 times
//     backoff: {
//       type: "exponential",
//       delay: 5000, // 5 sec gap
//     },

//     delay: 5000, // 🔥 5 sec baad send
//   }
// );
//     res.json({
//       message: "Email queued successfully 🚀",
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Failed to queue email",
//     });
//   }
// };

const db = require("../config/db");
const nodemailer = require("nodemailer");

// const sendMailByKey = async (req, res) => {
//   try {
//     const { secretKey, to, subject, message } = req.body;

//     // ✅ validation
//     const missingFields = ["secretKey", "to", "subject", "message"]
//       .filter(field => !req.body[field]);

//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         missingFields,
//       });
//     }

//     // ✅ 1. project find by secretKey
//     const [rows] = await db.query(
//       "SELECT * FROM projects WHERE secret_key = ? AND status = 'active'",
//       [secretKey]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         message: "Invalid or inactive project",
//       });
//     }

//     const project = rows[0];

//     // ❌ WhatsApp not supported here
//     if (project.via !== "Mail") {
//       return res.status(400).json({
//         message: "This project is not configured for email",
//       });
//     }

//     // 🔥 2. transporter create dynamically
//     let transporter;

//     // 👉 CASE 1: Default SMTP (tera system wala)
//     if (project.smtp_type === "Default") {
//       transporter = nodemailer.createTransport({
//         host: process.env.MAIL_HOST,
//         port: Number(process.env.MAIL_PORT),
//         auth: {
//           user: process.env.MAIL_USERNAME,
//           pass: process.env.MAIL_PASSWORD,
//         },
//       });
//     }

//     // 👉 CASE 2: Custom SMTP (AWS / Mailgun)
//     else if (project.smtp_type === "Custom") {

//       if (project.vendor === "Aws" || project.vendor === "Mailgun") {
//         transporter = nodemailer.createTransport({
//           host: project.host,
//           port: Number(project.port),
//           auth: {
//             user: project.smtp_username,
//             pass: project.smtp_password,
//           },
//         });
//       }

//       if (project.vendor === "Sendgrid") {
//         transporter = nodemailer.createTransport({
//           service: "SendGrid",
//           auth: {
//             user: "apikey",
//             pass: project.sendgrid_api_key,
//           },
//         });
//       }
//     }

//     // 🔥 3. send mail
//     const info = await transporter.sendMail({
//       from: `"${project.sender_name}" <${
//         project.custom_sender_email || project.sender_email
//       }>`,
//       to,
//       subject,
//       text: message,
//       html: `<p>${message}</p>`,
//     });

//     res.json({
//       message: "Email sent successfully ✅",
//       messageId: info.messageId,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Failed to send email",
//     });
//   }
// };

const sendEmail = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const { to, subject, html, text } = req.body;

    if (!apiKey) {
      return res.status(401).json({ message: "Missing API key" });
    }

    // ✅ project fetch
    const [rows] = await db.query(
      "SELECT * FROM projects WHERE secret_key = ? AND status = 'active'",
      [apiKey]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Invalid project" });
    }

    const project = rows[0];

   // 🔥 ARRAY HANDLE
 const emails = Array.isArray(to) ? to : [to];

// 🔥 bulk jobs create
const jobs = emails.map(email => ({
  name: "sendMailJob",
  data: {
    project,
    to: email,
    subject,
    html,
    text,
  },
}));

// 🔥 ek hi call me sab queue me
await mailQueue.addBulk(jobs);

res.json({
  message: `${emails.length} emails queued successfully 🚀`,
});

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};



module.exports = { sendEmail,
  // sendMailByKey,
  
 };