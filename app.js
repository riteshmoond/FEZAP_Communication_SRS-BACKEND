// app.js
const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");
const app = express();

// Middlewares

app.use(cookieParser());
app.use(cors({
  origin: 'http://148.135.136.249',
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;