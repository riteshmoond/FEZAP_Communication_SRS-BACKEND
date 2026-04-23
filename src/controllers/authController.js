// controllers/authController.js
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')

const registerUser = async (req, res) => {
  try {
    console.log("REGISTER HIT");

    const { name, email, password } = req.body;

    const existingUser = await userModel.findUserByEmail(email);

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.createUser({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      message: "User registered successfully ✅"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
const loginUser = async (req, res) => {
  try {
    console.log("LOGIN HIT");

    const { email, password } = req.body;

    const result = await userModel.findUserByEmail(email);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    return res.json({
      message: "Login successful ✅",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
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