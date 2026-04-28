require("dotenv").config();
const { Worker } = require("bullmq");
const redis = require("../config/redis");
const sendMail = require("../utils/sendMail");

const db = require("../config/db");          // ✅ ADD
const nodemailer = require("nodemailer");    // ✅ ADD
// const worker = new Worker(
//   "mailQueue",
//   async (job) => {
//     const { to, subject, message } = job.data;

//     console.log("Processing job:", job.id);

//     await sendMail({
//       to,
//       subject,
//       text: message,
//       html: `<p>${message}</p>`,
//     });

//     console.log("Mail sent:", job.id);
//   },
//   {
//     connection: redis,
//   }
// );

// worker.on("completed", (job) => {
//   console.log(`Job ${job.id} completed ✅`);
// });

// worker.on("failed", (job, err) => {
//   console.error(`Job ${job.id} failed ❌`, err);
// });

console.log("🚀 Worker started");


const worker = new Worker(
  "mailQueue",
  async (job) => {
        console.log("🔥 Processing job:", job.id);
    const { project, to, subject, html, text } = job.data;

    // 1️⃣ create log (pending)
    const [result] = await db.query(
      `INSERT INTO email_logs (project_id, recipient, subject, status)
       VALUES (?, ?, ?, ?)`,
      [project.id, to, subject, "pending"]
    );

    const emailId = result.insertId;

    try {
      const transporter = nodemailer.createTransport({
        host: project.host,
        port: project.port,
        auth: {
          user: project.smtp_username,
          pass: project.smtp_password,
        },
      });

      // 🔥 OPEN TRACKING PIXEL ADD
      const trackingPixel = `<img src="http://localhost:5000/track/open/${emailId}" width="1" height="1" />`;

      console.log("➡️ Sending mail to:", to);

  const info = await transporter.sendMail({
    from: project.sender_email,
    to,
    subject,
    html: html + trackingPixel,
    text,
  });

  console.log("✅ Mail sent:", info.messageId);

  await db.query(
    `UPDATE email_logs 
     SET status='sent', sent_at=NOW(), message_id=? 
     WHERE id=?`,
    [info.messageId, emailId]
  );

  console.log("📝 DB updated (sent)");

  await db.query(
    `UPDATE email_logs 
     SET status='delivered', delivered_at=NOW()
     WHERE id=?`,
    [emailId]
  );

  console.log("📦 Marked delivered");

} catch (err) {
  console.error("❌ ERROR:", err.message);

  await db.query(
    `UPDATE email_logs SET status='failed' WHERE id=?`,
    [emailId]
  );
}
  },
  { connection: redis, concurrency: 5 }
);