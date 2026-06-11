const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getAllBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nationality: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Get all books error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Get book by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createBook = async (req, res) => {
  try {
    const { title, isbn, description, publishedYear, genre, authorId } =
      req.body;

    if (!title || !isbn || !authorId) {
      return res.status(400).json({
        success: false,
        message: "Title, ISBN, and Author ID are required",
      });
    }

    const author = await prisma.author.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: "Book with this ISBN already exists",
      });
    }

    const book = await prisma.book.create({
      data: {
        title,
        isbn,
        description,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        genre,
        authorId,
      },
      include: {
        author: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    console.error("Create book error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isbn, description, publishedYear, genre, authorId } =
      req.body;

    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (isbn && isbn !== existingBook.isbn) {
      const bookWithIsbn = await prisma.book.findUnique({
        where: { isbn },
      });

      if (bookWithIsbn) {
        return res.status(409).json({
          success: false,
          message: "Book with this ISBN already exists",
        });
      }
    }

    if (authorId && authorId !== existingBook.authorId) {
      const author = await prisma.author.findUnique({
        where: { id: authorId },
      });

      if (!author) {
        return res.status(404).json({
          success: false,
          message: "Author not found",
        });
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: title || existingBook.title,
        isbn: isbn || existingBook.isbn,
        description:
          description !== undefined ? description : existingBook.description,
        publishedYear:
          publishedYear !== undefined
            ? parseInt(publishedYear)
            : existingBook.publishedYear,
        genre: genre !== undefined ? genre : existingBook.genre,
        authorId: authorId || existingBook.authorId,
      },
      include: {
        author: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await prisma.book.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
      data: existingBook,
    });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getBooksByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;

    const author = await prisma.author.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const books = await prisma.book.findMany({
      where: { authorId },
      include: {
        author: true,
      },
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Get books by author error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBooksByAuthor,
};
