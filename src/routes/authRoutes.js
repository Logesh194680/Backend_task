const express = require("express");
const {
  register,
  login,
  getCurrentUser,
} = require("../Controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticateToken, rateLimiter, getCurrentUser);

module.exports = router;
