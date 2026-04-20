// models/userModel.js
const db = require("../config/db");

// Check if user exists
const findUserByEmail = (email, callback) => {
  db.query("SELECT * FROM users WHERE email = ?", [email], callback);
};

// Create user
const createUser = (user, callback) => {
  const { name, email, password } = user;

  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    callback
  );
};

module.exports = {
  findUserByEmail,
  createUser
};