const express = require("express");
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBooksByAuthor,
} = require("../Controllers/bookController");
const { authenticateToken } = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.get("/author/:authorId", getBooksByAuthor);

router.post("/", authenticateToken, rateLimiter, createBook);
router.put("/:id", authenticateToken, rateLimiter, updateBook);
router.delete("/:id", authenticateToken, rateLimiter, deleteBook);

module.exports = router;
