// app.js
const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");
const app = express();

// Middlewares

app.use(cookieParser());
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;