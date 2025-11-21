// Import the Express framework for creating the router
import express from "express";
// Import quiz controller functions for handling quiz-related operations
import {
  getQuiz,
  getAllQuizzes,
  getQuizById,
  saveQuizResult,
  getQuizResults,
  getQuizAnalytics,
  startQuizSession,
  getQuizSession,
  updateQuizSession,
  completeQuizSession,
  deleteQuizResult,
} from "../controllers/quizController";
// Import the multer upload configuration for handling file uploads
import { upload } from "../config/multer";
// Import the protect middleware to ensure routes are authenticated
import { protect } from "../middleware/authMiddleware";
import { aiLimiter } from "../middleware/rateLimiter";
import { validateCreateQuiz } from "../middleware/validation";

// Create a new Express router instance for defining quiz-related routes...
const router = express.Router();

router.post(
  "/",
  protect,
  aiLimiter,
  upload.single("file"),
  validateCreateQuiz,
  getQuiz
);
router.get("/history", protect, getAllQuizzes);

// New routes for quiz results and analytics
router.post("/result", protect, saveQuizResult);
router.get("/results", protect, getQuizResults);
router.get("/analytics", protect, getQuizAnalytics);

// Define a GET route for "/:id" to retrieve a specific quiz by its ID, requiring authentication
// This must come after specific routes to avoid conflicts
router.get("/:id", protect, getQuizById);

// Quiz session routes
router.post("/sessions", protect, startQuizSession);
router.get("/sessions/:sessionToken", protect, getQuizSession);
router.put("/sessions/:sessionToken", protect, updateQuizSession);
router.post("/sessions/:sessionToken/complete", protect, completeQuizSession);

// Delete quiz result route
router.delete("/results/:id", protect, deleteQuizResult);

// Export the router to be used in the main application
export default router;

