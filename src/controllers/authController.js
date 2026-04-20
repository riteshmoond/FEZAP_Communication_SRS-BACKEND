// controllers/authController.js
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    userModel.findUserByEmail(email, async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        return res.status(400).json({
          message: "User already exists with this email"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save user
      userModel.createUser(
        { name, email, password: hashedPassword },
        (err, result) => {
          if (err) return res.status(500).json(err);

          res.status(201).json({
            message: "User registered successfully ✅"
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error
    });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  userModel.findUserByEmail(email, async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Cookie set
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // production me true
      sameSite: "lax"
    });

    res.json({
      message: "Login successful ✅",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
};

// controllers/authController.js

const getMe = async (req, res) => {
  res.json({
    message: "User fetched ✅",
    user: req.user
  });
};

// controllers/authController.js

const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // production me true
    sameSite: "lax"
  });

  res.json({
    message: "Logged out successfully ✅"
  });
};

module.exports={
    registerUser,
    loginUser,
    getMe,
    logoutUser
}