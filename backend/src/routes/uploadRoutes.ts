// Import the Express framework for creating the router
import express from "express";
// Import the upload middleware for handling file uploads
import { upload } from "../middleware/uploadMiddleware";
// Import upload controller functions for handling file operations
import {
  getFiles, // Function to retrieve all uploaded files
  uploadFiles, // Function to handle file uploads
  deleteFile, // Function to delete a specific file
} from "../controllers/uploadController";
// Import the protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";
import { uploadLimiter } from "../middleware/rateLimiter";
import { validateFileUpload } from "../middleware/validation";

// Create a new Express router instance for defining upload-related routes
const router = express.Router();

// Define a GET route for "/files" to fetch all uploaded files for the frontend UI, requiring authentication
router.get("/files", protect, getFiles);

// POST /api/upload  (field name: files)
// Use upload.array('files', 10) to accept up to 10 files — adjust as needed
router.post("/upload", protect, uploadLimiter, upload.array("files", 10), validateFileUpload, uploadFiles);

// Define a DELETE route for "/files/:id" to delete a specific file by its ID, requiring authentication
router.delete("/files/:id", protect, deleteFile);

// Export the router to be used in the main application
export default router;
