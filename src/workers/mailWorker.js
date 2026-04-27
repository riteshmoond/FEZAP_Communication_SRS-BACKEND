require("dotenv").config();
const { Worker } = require("bullmq");
const redis = require("../config/redis");
const sendMail = require("../utils/sendMail");

const worker = new Worker(
  "mailQueue",
  async (job) => {
    const { to, subject, message } = job.data;

    console.log("Processing job:", job.id);

    await sendMail({
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    console.log("Mail sent:", job.id);
  },
  {
    connection: redis,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed ✅`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed ❌`, err);
});