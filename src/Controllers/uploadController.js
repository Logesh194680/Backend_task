const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");
const { uploadToCloudinary } = require("../utils/cloudinary");

const prisma = new PrismaClient();

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const userId = req.user.id;
    const file = req.file;

    let processedImageBuffer = file.buffer;

    if (file.mimetype.startsWith("image/")) {
      processedImageBuffer = await sharp(file.buffer)
        .resize(1024, 1024, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    const uploadResult = await uploadToCloudinary(
      processedImageBuffer,
      file.originalname,
      userId,
    );

    const imageRecord = await prisma.uploadedImage.create({
      data: {
        fileName: file.originalname,
        fileUrl: uploadResult.secure_url,
        fileSize: uploadResult.bytes,
        mimeType: file.mimetype,
        publicId: uploadResult.public_id,
        userId: userId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Image uploaded and processed successfully",
      data: {
        id: imageRecord.id,
        fileName: imageRecord.fileName,
        fileUrl: imageRecord.fileUrl,
        fileSize: imageRecord.fileSize,
        mimeType: imageRecord.mimeType,
        createdAt: imageRecord.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: error.message,
    });
  }
};

const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;

    const images = await prisma.uploadedImage.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    console.error("Get user images error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving images",
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const image = await prisma.uploadedImage.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const { deleteFromCloudinary } = require("../utils/cloudinary");
    await deleteFromCloudinary(image.publicId);

    await prisma.uploadedImage.delete({
      where: { id: image.id },
    });

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting image",
    });
  }
};

module.exports = {
  uploadImage,
  getUserImages,
  deleteImage,
};
