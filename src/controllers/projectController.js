const {generateSecretKey} = require('../utils/generateSecretKey')
const db = require("../config/db");



const createProject = async (req, res) => {
  try {
    const {
      projectName,
      senderName,
      senderEmail,
      replyTo,
      isClientSmtp,
      vendor,
      senderEmailUsername,

      host,
      port,
      username,
      password,
      customSenderEmail,
      customReplyTo,
      sendgridApiKey,
    } = req.body;

    // ✅ 1. Basic required fields
   const requiredFields = {
  projectName,
  senderName,
  senderEmail,
  replyTo,
  isClientSmtp,
  vendor,
  senderEmailUsername,
};

const missingFields = Object.entries(requiredFields)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingFields.length > 0) {
  return res.status(400).json({
    message: "Missing required fields",
    missingFields,
  });
}

    // ✅ 2. Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({ message: "Invalid sender email" });
    }

    if (!emailRegex.test(replyTo)) {
      return res.status(400).json({ message: "Invalid reply email" });
    }

    // ✅ 3. SMTP logic validation
    if (isClientSmtp === "Custom") {
      if (vendor === "Aws" || vendor === "Mailgun") {
        if (!host || !port || !username || !password) {
          return res.status(400).json({
            message: "SMTP config required (host, port, username, password)",
          });
        }
      }

      if (vendor === "Sendgrid") {
        if (!sendgridApiKey) {
          return res.status(400).json({
            message: "Sendgrid API key required",
          });
        }
      }
    }

    // ✅ 4. Generate key
    const secretKey = generateSecretKey();

    // ✅ 5. Insert
    await db.query(
      `INSERT INTO projects 
      (name, user_id, secret_key,
       sender_name, sender_email, reply_to,
       smtp_type, vendor, sender_email_username,
       host, port, smtp_username, smtp_password,
       custom_sender_email, custom_reply_to,
       sendgrid_api_key)
       
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectName,
        req.user.id,
        secretKey,

        senderName,
        senderEmail,
        replyTo,

        isClientSmtp,
        vendor,
        senderEmailUsername,

        host || null,
        port || null,
        username || null,
        password || null,

        customSenderEmail || null,
        customReplyTo || null,

        sendgridApiKey || null,
      ]
    );

    res.status(201).json({
      message: "Project created successfully",
      secretKey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      projectName,
      senderName,
      senderEmail,
      replyTo,
      isClientSmtp,
      vendor,
      senderEmailUsername,

      host,
      port,
      username,
      password,
      customSenderEmail,
      customReplyTo,
      sendgridApiKey,
    } = req.body;

    // ✅ 1. Required fields check
    const requiredFields = {
      projectName,
      senderName,
      senderEmail,
      replyTo,
      isClientSmtp,
      vendor,
      senderEmailUsername,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // ✅ 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({
        message: "Invalid sender email",
      });
    }

    if (!emailRegex.test(replyTo)) {
      return res.status(400).json({
        message: "Invalid reply email",
      });
    }

    // ✅ 3. SMTP validation
    if (isClientSmtp === "Custom") {
      if (vendor === "Aws" || vendor === "Mailgun") {
        const smtpFields = { host, port, username, password };

        const missingSmtpFields = Object.entries(smtpFields)
          .filter(([_, value]) => !value)
          .map(([key]) => key);

        if (missingSmtpFields.length > 0) {
          return res.status(400).json({
            message: "Missing SMTP fields",
            missingFields: missingSmtpFields,
          });
        }
      }

      if (vendor === "Sendgrid") {
        if (!sendgridApiKey) {
          return res.status(400).json({
            message: "Missing required fields",
            missingFields: ["sendgridApiKey"],
          });
        }
      }
    }

    // ✅ 4. Check project exists
    const [rows] = await db.query(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // ✅ 5. Owner check (VERY IMPORTANT 🔐)
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // ✅ 6. Update
    await db.query(
      `UPDATE projects SET
        name=?,
        sender_name=?,
        sender_email=?,
        reply_to=?,
        smtp_type=?,
        vendor=?,
        sender_email_username=?,
        host=?,
        port=?,
        smtp_username=?,
        smtp_password=?,
        custom_sender_email=?,
        custom_reply_to=?,
        sendgrid_api_key=?
       WHERE id=?`,
      [
        projectName,
        senderName,
        senderEmail,
        replyTo,
        isClientSmtp,
        vendor,
        senderEmailUsername,
        host || null,
        port || null,
        username || null,
        password || null,
        customSenderEmail || null,
        customReplyTo || null,
        sendgridApiKey || null,
        id,
      ]
    );

    res.json({
      message: "Project updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // optional search
    const search = req.query.search || "";

    // query
    const [projects] = await db.query(
      `SELECT id, name, status, sender_email, created_at 
       FROM projects 
       WHERE user_id = ? AND name LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, `%${search}%`, limit, offset]
    );

    // total count (for pagination)
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total 
       FROM projects 
       WHERE user_id = ? AND name LIKE ?`,
      [userId, `%${search}%`]
    );

    res.json({
      message: "Projects fetched successfully",
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProjects: total,
      projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT * FROM projects WHERE id = ?`,
      [projectId]
    );

    // ❌ Not found
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const project = rows[0];

    // 🔐 Owner check
    if (project.user_id !== userId) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json({
      message: "Project fetched successfully",
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ✅ 1. Required field check
    if (!status) {
      return res.status(400).json({
        message: "Missing required field",
        missingFields: ["status"],
      });
    }

    // ✅ 2. Allowed values check
    const allowedStatus = ["active", "inactive"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        allowedValues: allowedStatus,
      });
    }

    // ✅ 3. Check project exists
    const [rows] = await db.query(
      "SELECT id, user_id, status FROM projects WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const project = rows[0];

    // 🔐 4. Owner check
    if (project.user_id !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // (Optional) same status → no-op
    if (project.status === status) {
      return res.json({
        message: `Project already ${status}`,
      });
    }

    // ✅ 5. Update only status
    await db.query(
      "UPDATE projects SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({
      message: "Project status updated successfully",
      status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports={
    createProject,
    updateProject,
    getProjects,
    getProjectById,
    updateProjectStatus
}