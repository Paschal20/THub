import express from "express";
import { CBTController } from "../controllers/CBTController";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();
const cbtController = new CBTController();

// CBT Quiz Management Routes
router.post(
  "/generate",
  protect,
  upload.single("file"),
  cbtController.generateCBTQuiz
);

router.get("/quizzes", protect, cbtController.getCBTQuizzes);
router.get("/quizzes/:id", protect, cbtController.getCBTQuizById);

// CBT Session Management Routes
router.post("/quizzes/:quizId/start", protect, cbtController.startCBTSession);
router.get("/session/:sessionToken", protect, cbtController.getCBTSession);
router.post("/session/:sessionToken/answer", protect, cbtController.submitCBTAnswer);
router.post("/session/:sessionToken/flag", protect, cbtController.flagCBTQuestion);
router.post("/session/:sessionToken/pause", protect, cbtController.pauseCBTSession);
router.post("/session/:sessionToken/resume", protect, cbtController.resumeCBTSession);
router.post("/session/:sessionToken/submit", protect, cbtController.submitCBTQuiz);

// CBT Results Routes
router.get("/results", protect, cbtController.getCBTResults);
router.get("/results/:id", protect, cbtController.getCBTResultById);

export default router;