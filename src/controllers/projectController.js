const {generateSecretKey} = require('../utils/generateSecretKey')
const db = require("../config/db");


const createProject = async (req, res) => {
  try {
    const {
      via,
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
  via,
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

    if (!["Mail", "WhatsApp"].includes(via)) {
      return res.status(400).json({
        message: "Invalid via value",
        allowedValues: ["Mail", "WhatsApp"],
      });
    }

    // ✅ 2. Channel validation
    const allowedChannels = ["Mail", "WhatsApp"];

    if (!allowedChannels.includes(via)) {
      return res.status(400).json({
        message: "Invalid via",
        allowedValues: allowedChannels,
      });
    }

    // ✅ 3. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({ message: "Invalid sender email" });
    }

    if (!emailRegex.test(replyTo)) {
      return res.status(400).json({ message: "Invalid reply email" });
    }

    // ✅ 4. SMTP validation
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

    // ✅ 5. Secret key
    const secretKey = generateSecretKey();

    // ✅ 6. Insert
    await db.query(
      `INSERT INTO projects 
      (name, user_id, secret_key, status,
       via,
       sender_name, sender_email, reply_to,
       smtp_type, vendor, sender_email_username,
       host, port, smtp_username, smtp_password,
       custom_sender_email, custom_reply_to,
       sendgrid_api_key)
       
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectName,
        req.user.id,
        secretKey,
        "active",
        via,

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
      via,
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
      via,
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

    if (!["Mail", "WhatsApp"].includes(via)) {
      return res.status(400).json({
        message: "Invalid via value",
        allowedValues: ["Mail", "WhatsApp"],
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
        via=?,
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
        via,
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
      `SELECT id, name, secret_key, status, via,
       sender_name, sender_email, reply_to,
       smtp_type, vendor, sender_email_username,
       host, port, smtp_username, smtp_password,
       custom_sender_email, custom_reply_to,
       sendgrid_api_key, created_at
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

const getProjectDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[projectStats]] = await db.query(
      `SELECT
        COUNT(*) AS totalProjects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeProjects
       FROM projects
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      message: "Dashboard fetched successfully",
      summary: {
        totalEmails: 0,
        failedEmails: 0,
        activeProjects: Number(projectStats.activeProjects || 0),
        totalProjects: Number(projectStats.totalProjects || 0),
      },
      recentActivity: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProjectReport = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const [projects] = await db.query(
      "SELECT id, user_id FROM projects WHERE id = ?",
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (projects[0].user_id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      message: "Project report fetched successfully",
      summary: {
        totalEmails: 0,
        totalSend: 0,
        totalDelivered: 0,
        totalOpen: 0,
        totalBounce: 0,
      },
      reports: [],
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
    updateProjectStatus,
    getProjectDashboard,
    getProjectReport
}
