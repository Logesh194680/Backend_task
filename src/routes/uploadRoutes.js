const express = require("express");
const {
  uploadImage,
  getUserImages,
  deleteImage,
} = require("../Controllers/uploadController");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  uploadImage: uploadMiddleware,
  handleUploadError,
} = require("../middleware/uploadMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/upload",
  authenticateToken,
  rateLimiter,
  uploadMiddleware,
  handleUploadError,
  uploadImage,
);

router.get("/my-images", authenticateToken, rateLimiter, getUserImages);

router.delete("/image/:id", authenticateToken, rateLimiter, deleteImage);

module.exports = router;
