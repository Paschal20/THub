// Import the Express framework for creating the router
import express from "express";
// Import chat controller functions for handling various chat-related operations
import {
  createChat, // Function to create a new chat
  sendMessage, // Function to send a message in a chat
  getChats, // Function to retrieve all chats for a user
  getChat, // Function to retrieve a specific chat by ID
  deleteChat, // Function to delete a chat by ID
  clearAllChats, // Function to clear all chats for a user
} from "../controllers/chatController";
// Import the multer upload configuration for handling file uploads
import { upload } from "../config/multer";
// Import the protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";
import { aiLimiter } from "../middleware/rateLimiter";
import { validateCreateChat, validateSendMessage } from "../middleware/validation";

// Create a new Express router instance for defining chat-related routes
const router = express.Router();

router.post("/", protect, validateCreateChat, createChat);
router.post("/message", protect, aiLimiter, upload.single("file"), validateSendMessage, sendMessage);
router.get("/", protect, getChats);
// Define a GET route for "/:chatId" to retrieve a specific chat by its ID, requiring authentication
router.get("/:chatId", protect, getChat);
// Define a DELETE route for "/:chatId" to delete a specific chat by its ID, requiring authentication
router.delete("/:chatId", protect, deleteChat);
// Define a DELETE route for "/clear" to clear all chats for the authenticated user
router.delete("/clear", protect, clearAllChats);

// Export the router to be used in the main application
export default router;
