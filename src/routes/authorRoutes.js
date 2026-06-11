const express = require("express");
const {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require("../Controllers/authorController");
const { authenticateToken } = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", getAllAuthors);
router.get("/:id", getAuthorById);

router.post("/", authenticateToken, rateLimiter, createAuthor);
router.put("/:id", authenticateToken, rateLimiter, updateAuthor);
router.delete("/:id", authenticateToken, rateLimiter, deleteAuthor);

module.exports = router;
