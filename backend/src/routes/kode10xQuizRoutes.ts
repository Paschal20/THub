import express from "express";
import {
  getRandomQuestion,
  getAllQuestionsWithAnswers,
  submitQuiz,
  createQuestion,
  getAllSubjects,
  getUserResults,
  getQuizHistory
} from "../controllers/kode10xQuizController";
import { protect } from "../middleware/authMiddleware";
import { authorizeRole } from "../middleware/authorize";

const kode10xQuizRouter = express.Router();

// Create question - protected (admins)
kode10xQuizRouter.post('/createQuestion', createQuestion);

// Public: get random questions by subject (example: /getRandomQuestions/math)
kode10xQuizRouter.get('/getRandomQuestions/:subject', protect, getRandomQuestion);

// Public: get all available subjects
kode10xQuizRouter.get('/subjects', getAllSubjects);

// Get all questions with answers - protected (admins)
kode10xQuizRouter.get("/getQuestionsWithAnswers", protect, authorizeRole(['admin']), getAllQuestionsWithAnswers);

// Submit quiz - protected (authenticated users)
kode10xQuizRouter.post("/submitQuiz", protect, submitQuiz);

// Get user results - protected (authenticated users)
kode10xQuizRouter.get("/results/:userId", protect, getUserResults);

// Get quiz history with filters - protected (authenticated users)
kode10xQuizRouter.get("/history/:userId", protect, getQuizHistory);

export default kode10xQuizRouter;