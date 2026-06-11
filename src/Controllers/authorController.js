const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllAuthors = async (req, res) => {
  try {
    const authors = await prisma.author.findMany({
      include: {
        books: {
          select: {
            id: true,
            title: true,
            isbn: true,
            publishedYear: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: authors.length,
      data: authors,
    });
  } catch (error) {
    console.error("Get all authors error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    res.status(200).json({
      success: true,
      data: author,
    });
  } catch (error) {
    console.error("Get author by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createAuthor = async (req, res) => {
  try {
    const { name, bio, birthYear, nationality } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const author = await prisma.author.create({
      data: {
        name,
        bio,
        birthYear: birthYear ? parseInt(birthYear) : null,
        nationality,
      },
    });

    res.status(201).json({
      success: true,
      message: "Author created successfully",
      data: author,
    });
  } catch (error) {
    console.error("Create author error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, birthYear, nationality } = req.body;

    const existingAuthor = await prisma.author.findUnique({
      where: { id },
    });

    if (!existingAuthor) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const updatedAuthor = await prisma.author.update({
      where: { id },
      data: {
        name: name || existingAuthor.name,
        bio: bio !== undefined ? bio : existingAuthor.bio,
        birthYear:
          birthYear !== undefined
            ? parseInt(birthYear)
            : existingAuthor.birthYear,
        nationality:
          nationality !== undefined ? nationality : existingAuthor.nationality,
      },
    });

    res.status(200).json({
      success: true,
      message: "Author updated successfully",
      data: updatedAuthor,
    });
  } catch (error) {
    console.error("Update author error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    const existingAuthor = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });

    if (!existingAuthor) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    await prisma.author.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Author deleted successfully",
      data: {
        deletedAuthor: existingAuthor,
        associatedBooksDeleted: existingAuthor.books.length,
      },
    });
  } catch (error) {
    console.error("Delete author error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};
