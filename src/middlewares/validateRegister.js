// middleware/validateRegister.js
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  // Name: only letters + space (min 3)
  const nameRegex = /^[A-Za-z ]{3,}$/;

  // Email: standard format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Password:
  // min 6 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  if (!nameRegex.test(name)) {
    return res.status(400).json({
      message: "Name must be at least 3 characters and only letters"
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format"
    });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be 6+ chars with uppercase, lowercase and number"
    });
  }

  next();
};

module.exports = validateRegister;