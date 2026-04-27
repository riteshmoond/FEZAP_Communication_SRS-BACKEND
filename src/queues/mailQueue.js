const { Queue } = require("bullmq");
const redis = require("../config/redis");

const mailQueue = new Queue("mailQueue", {
  connection: redis,
});

module.exports = mailQueue;