import * as crypto from "crypto";
import * as fs from "fs/promises";
import { Request, Response } from "express";
import { CBTQuizGenerationService, CBTQuizGenerationOptions } from "../services/CBTQuizGenerationService";
import CBTQuiz, { ICBTQuiz, ICBTQuestion } from "../models/CBTQuiz";
import CBTQuizResult from "../models/CBTQuizResult";
import CBTQuizSession from "../models/CBTQuizSession";
import { AuthRequest } from "../middleware/authMiddleware";
import { CBTValidationService } from "../services/CBTContentProcessor";
import { validateFillInBlankAnswer } from "../utils/CBTStringMatching";

// Helper to safely extract message from unknown errors
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}

export class CBTController {
  private generationService: CBTQuizGenerationService;
  private validationService: CBTValidationService;

  static readonly ESTIMATED_TIME_PER_QUESTION = 30; // seconds
  static readonly SUCCESS_RATE_THRESHOLD = 0.6; // 60%
  static readonly MIN_QUESTIONS = 1;
  static readonly MAX_QUESTIONS = 50;

  constructor() {
    this.generationService = new CBTQuizGenerationService();
    this.validationService = new CBTValidationService();
  }

  generateCBTQuiz = async (req: AuthRequest, res: Response) => {
    try {
      const {
        topic,
        difficulty = "easy",
        numQuestions = 5,
        questionType = "multiple-choice",
        content: bodyContent,
      } = req.body;
      const uploadedFile = req.file;

      let quizContent: string | undefined = bodyContent;

      if (uploadedFile) {
        // Read content from the uploaded file
        const filePath = uploadedFile.path;
        quizContent = await fs.readFile(filePath, "utf-8");
        // Optionally, delete the file after reading if it's a temporary upload
        // await fs.unlink(filePath);
      }

      // Validate input
      if (!topic && !quizContent) {
        return res.status(400).json({
          success: false,
          error: "Either topic or content must be provided",
        });
      }

      if (
        numQuestions < CBTController.MIN_QUESTIONS ||
        numQuestions > CBTController.MAX_QUESTIONS
      ) {
        return res.status(400).json({
          success: false,
          error: `Number of questions must be between ${CBTController.MIN_QUESTIONS} and ${CBTController.MAX_QUESTIONS}`,
        });
      }

      const questionTypes = Array.isArray(questionType)
        ? questionType
        : [questionType];

      // Generate quiz
      const options: CBTQuizGenerationOptions = {
        topic,
        difficulty,
        numQuestions,
        questionTypes,
        userId: req.user!.id,
      };
      if (quizContent) {
        options.content = quizContent;
      }
      const result = await this.generationService.generateCBTQuiz(options);

      // Save to database
      const quiz = new CBTQuiz({
        title: `CBT Quiz: ${topic}`,
        topic,
        source: quizContent ? "content" : "topic",
        difficulty,
        numQuestions,
        questions: result.questions,
        userId: req.user!.id,
        category: "general",
        estimatedTime: numQuestions * CBTController.ESTIMATED_TIME_PER_QUESTION,
      });

      await quiz.save();

      res.status(201).json({
        success: true,
        data: {
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            topic: quiz.topic,
            difficulty: quiz.difficulty,
            numQuestions: quiz.numQuestions,
            estimatedTime: quiz.estimatedTime,
            category: quiz.category,
          },
        },
      });
    } catch (err: unknown) {
      console.error("CBT Quiz generation error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  getCBTQuizzes = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10, difficulty, category, isPublic } = req.query;
      const userId = req.user!.id;

      const query: any = { userId };

      if (difficulty) query.difficulty = difficulty;
      if (category) query.category = category;
      if (isPublic !== undefined) query.isPublic = isPublic === "true";

      const quizzes = await CBTQuiz.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .select("_id title topic difficulty numQuestions estimatedTime category isPublic status createdAt");

      const total = await CBTQuiz.countDocuments(query);

      res.json({
        success: true,
        data: {
          quizzes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (err: unknown) {
      console.error("Get CBT quizzes error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  getCBTQuizById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;

      const quiz = await CBTQuiz.findOne({ _id: id, userId });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "CBT Quiz not found",
        });
      }

      res.json({
        success: true,
        data: { quiz },
      });
    } catch (err: unknown) {
      console.error("Get CBT quiz by ID error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  startCBTSession = async (req: AuthRequest, res: Response) => {
    try {
      const { quizId } = req.params as { quizId: string };
      const userId = req.user!.id;

      // Check if quiz exists and user has access
      const quiz = await CBTQuiz.findOne({ _id: quizId, userId });
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "CBT Quiz not found",
        });
      }

      // Check if there's already an active session
      const existingSession = await CBTQuizSession.findActiveByUserAndQuiz(userId, quizId);
      if (existingSession) {
        return res.json({
          success: true,
          data: {
            session: {
              _id: existingSession._id,
              sessionToken: existingSession.sessionToken,
              timeRemaining: existingSession.timeRemaining,
              currentQuestionIndex: existingSession.currentQuestionIndex,
            },
          },
        });
      }

      // Create new session
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const timeLimit = quiz.estimatedTime; // estimatedTime is already in seconds
      const expiresAt = new Date(Date.now() + timeLimit * 1000 + 24 * 60 * 60 * 1000); // Add 24 hours buffer

      const session = new CBTQuizSession({
        userId,
        quizId,
        sessionToken,
        timeRemaining: timeLimit,
        expiresAt,
      });

      await session.save();

      res.status(201).json({
        success: true,
        data: {
          session: {
            _id: session._id,
            sessionToken: session.sessionToken,
            timeRemaining: session.timeRemaining,
            currentQuestionIndex: session.currentQuestionIndex,
          },
        },
      });
    } catch (err: unknown) {
      console.error("Start CBT session error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  getCBTSession = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params as { sessionToken: string };
      const userId = req.user!.id;

      const session = await CBTQuizSession.findOne({
        sessionToken,
        userId,
        status: { $in: ["active", "paused"] },
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "CBT Session not found or expired",
        });
      }

      // Get quiz data
      const quiz = await CBTQuiz.findById(session.quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "CBT Quiz not found",
        });
      }

      res.json({
        success: true,
        data: {
          session: {
            _id: session._id,
            status: session.status,
            timeRemaining: session.timeRemaining,
            currentQuestionIndex: session.currentQuestionIndex,
            flaggedQuestions: session.metadata.flaggedQuestions,
          },
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            numQuestions: quiz.numQuestions,
            questions: quiz.questions.map((q, index) => ({
              _id: q._id,
              question: q.question,
              options: q.options,
              type: q.type,
              points: q.points,
              timeLimit: q.timeLimit,
              hints: q.hints,
              isFlagged: session.metadata.flaggedQuestions.includes(q._id),
              isAnswered: session.answers.has(q._id),
            })),
          },
        },
      });
    } catch (err: unknown) {
      console.error("Get CBT session error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  submitCBTAnswer = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params as { sessionToken: string };
      const { questionId, answer } = req.body;
      const userId = req.user!.id;

      const session = await CBTQuizSession.findOne({
        sessionToken,
        userId,
        status: "active",
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "CBT Session not found or not active",
        });
      }

      // Submit answer
      session.submitAnswer(questionId, answer);
      await session.save();

      res.json({
        success: true,
        message: "Answer submitted successfully",
      });
    } catch (err: unknown) {
      console.error("Submit CBT answer error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  flagCBTQuestion = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params as { sessionToken: string };
      const { questionId, flag } = req.body;
      const userId = req.user!.id;

      const session = await CBTQuizSession.findOne({
        sessionToken,
        userId,
        status: "active",
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "CBT Session not found or not active",
        });
      }

      if (flag) {
        session.flagQuestion(questionId);
      } else {
        session.unflagQuestion(questionId);
      }

      await session.save();

      res.json({
        success: true,
        message: `Question ${flag ? "flagged" : "unflagged"} successfully`,
      });
    } catch (err: unknown) {
      console.error("Flag CBT question error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  pauseCBTSession = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params as { sessionToken: string };
      const userId = req.user!.id;

      const session = await CBTQuizSession.findOne({
        sessionToken,
        userId,
        status: "active",
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "CBT Session not found or not active",
        });
      }

      session.pause();
      await session.save();

      res.json({
        success: true,
        message: "CBT Session paused successfully",
      });
    } catch (err: unknown) {
      console.error("Pause CBT session error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  resumeCBTSession = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params as { sessionToken: string };
      const userId = req.user!.id;

      const session = await CBTQuizSession.findOne({
        sessionToken,
        userId,
        status: "paused",
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "CBT Session not found or not paused",
        });
      }

      session.resume();
      await session.save();

      res.json({
        success: true,
        message: "CBT Session resumed successfully",
      });
    } catch (err: unknown) {
      console.error("Resume CBT session error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  submitCBTQuiz = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params as { sessionToken: string };
      const { feedback } = req.body;
      const userId = req.user!.id;

      const session = await CBTQuizSession.findOne({
        sessionToken,
        userId,
        status: { $in: ["active", "paused"] },
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "CBT Session not found",
        });
      }

      // Get quiz
      const quiz = await CBTQuiz.findById(session.quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "CBT Quiz not found",
        });
      }

      // Calculate score
      let correctAnswers = 0;
      const selectedAnswers = Array.from(session.answers.entries());

      for (const [questionId, selectedAnswer] of selectedAnswers) {
        const question = quiz.questions.find(q => q._id === questionId);
        if (question) {
          let isCorrect = false;

          if (question.type === "fill-in-the-blank") {
            isCorrect = validateFillInBlankAnswer(selectedAnswer, question.answer);
          } else {
            isCorrect = selectedAnswer === question.answer;
          }

          if (isCorrect) correctAnswers++;
        }
      }

      // Create result
      const result = new CBTQuizResult({
        userId,
        quizId: quiz._id,
        score: correctAnswers,
        totalQuestions: quiz.numQuestions,
        selectedAnswers: session.answers,
        timeTaken: quiz.estimatedTime - session.timeRemaining, // Calculate actual time taken
        status: "completed",
        completedAt: new Date(),
        feedback,
      });

      await result.save();

      // Update session
      session.status = "completed";
      await session.save();

      // Update quiz statistics
      quiz.updateStatistics(correctAnswers, result.timeTaken, quiz.numQuestions);
      await quiz.save();

      res.json({
        success: true,
        data: {
          result: {
            _id: result._id,
            score: result.score,
            totalQuestions: result.totalQuestions,
            percentage: result.percentage,
            performanceRating: result.performanceRating,
            timeTaken: result.timeTaken,
            completedAt: result.completedAt,
          },
          insights: result.generateInsights(),
        },
      });
    } catch (err: unknown) {
      console.error("Submit CBT quiz error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  getCBTResults = async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user!.id;

      const results = await CBTQuizResult.find({ userId, status: "completed" })
        .populate("quizId", "title topic difficulty")
        .sort({ completedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await CBTQuizResult.countDocuments({ userId, status: "completed" });

      res.json({
        success: true,
        data: {
          results: results.map(result => ({
            _id: result._id,
            quiz: result.quizId,
            score: result.score,
            totalQuestions: result.totalQuestions,
            percentage: result.percentage,
            performanceRating: result.performanceRating,
            timeTaken: result.timeTaken,
            completedAt: result.completedAt,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (err: unknown) {
      console.error("Get CBT results error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };

  getCBTResultById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;

      const result = await CBTQuizResult.findOne({ _id: id, userId })
        .populate("quizId");

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "CBT Result not found",
        });
      }

      res.json({
        success: true,
        data: { result },
      });
    } catch (err: unknown) {
      console.error("Get CBT result by ID error:", err);
      res.status(500).json({
        success: false,
        error: extractErrorMessage(err),
      });
    }
  };
}