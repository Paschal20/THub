import * as crypto from "crypto";
import { Response } from "express";
import { QuizGenerationService } from "../services/QuizGenerationService";
import Quiz, { IQuiz, IQuestion } from "../models/Quiz";
import QuizResult from "../models/QuizResult";
import QuizSession from "../models/QuizSession";
import { AuthRequest } from "../middleware/authMiddleware";

import { validateFillInBlankAnswer } from "../utils/stringMatching";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

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

export class QuizController {
  private generationService: QuizGenerationService;

  static readonly ESTIMATED_TIME_PER_QUESTION = 80; // seconds (1 minute 20 seconds)
  static readonly SUCCESS_RATE_THRESHOLD = 0.6; // 60%
  static readonly MIN_QUESTIONS = 1;
  static readonly MAX_QUESTIONS = 50;

  constructor() {
    this.generationService = new QuizGenerationService();
  }

  private determineCategory(topic: string): string {
    const lowerTopic = topic.toLowerCase();
    if (lowerTopic.includes('math') || lowerTopic.includes('mathematics')) return 'Mathematics';
    if (lowerTopic.includes('physics')) return 'Physics';
    if (lowerTopic.includes('chemistry')) return 'Chemistry';
    if (lowerTopic.includes('biology')) return 'Biology';
    if (lowerTopic.includes('english') || lowerTopic.includes('literature')) return 'English/Literature';
    if (lowerTopic.includes('history')) return 'History';
    if (lowerTopic.includes('geography')) return 'Geography';
    if (lowerTopic.includes('government') || lowerTopic.includes('civics')) return 'Government';
    if (lowerTopic.includes('economics') || lowerTopic.includes('commerce')) return 'Economics/Commerce';
    if (lowerTopic.includes('computer') || lowerTopic.includes('programming')) return 'Computer Science';
    if (lowerTopic.includes('agricultural')) return 'Agricultural Science';
    return 'General';
  }

  generateQuiz = async (req: AuthRequest, res: Response) => {
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
        // Validate file type for quiz generation - support text, PDF, and DOCX files
        const allowedMimetypes = [
          "text/plain",
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedMimetypes.includes(uploadedFile.mimetype)) {
          return res.status(400).json({
            success: false,
            error:
              "Only plain text (.txt), PDF (.pdf), and Word document (.docx) files are supported for quiz generation.",
          });
        }

        try {
          // Extract text content based on file type
          if (uploadedFile.mimetype === "text/plain") {
            quizContent = uploadedFile.buffer.toString("utf-8");
          } else if (uploadedFile.mimetype === "application/pdf") {
            const pdfData = await pdfParse(uploadedFile.buffer);
            quizContent = pdfData.text;
          } else if (
            uploadedFile.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            const result = await mammoth.extractRawText({
              buffer: uploadedFile.buffer,
            });
            quizContent = result.value;
          }

          console.log(
            `File uploaded for quiz generation: ${
              uploadedFile.originalname
            }, type: ${uploadedFile.mimetype}, size: ${
              uploadedFile.size
            }, content length: ${quizContent?.length || 0}`
          );
        } catch (error) {
          console.error("Error processing uploaded file:", error);
          return res.status(400).json({
            success: false,
            error:
              "Failed to process the uploaded file. Please ensure it's a valid text, PDF, or Word document.",
          });
        }
      }

      // Validate input
      if (!topic && !quizContent) {
        return res.status(400).json({
          success: false,
          error: "Either topic or content must be provided",
        });
      }

      if (
        numQuestions < QuizController.MIN_QUESTIONS ||
        numQuestions > QuizController.MAX_QUESTIONS
      ) {
        return res.status(400).json({
          success: false,
          error: `Number of questions must be between ${QuizController.MIN_QUESTIONS} and ${QuizController.MAX_QUESTIONS}`,
        });
      }

      const questionTypes = Array.isArray(questionType)
        ? questionType
        : [questionType];

      // Generate quiz
      const generateOptions: any = {
        topic,
        difficulty,
        numQuestions,
        questionTypes,
        userId: req.user!.id,
      };

      if (quizContent) {
        generateOptions.content = quizContent;
      }

      const result = await this.generationService.generateQuiz(generateOptions);

      // Save to database
      const dateStr = new Date().toISOString().split('T')[0];
      const quiz = new Quiz({
        title: `Quiz: ${topic} (${difficulty}) - ${dateStr}`,
        topic,
        source: quizContent ? "content" : "topic",
        difficulty,
        numQuestions,
        questions: result.questions,
        userId: req.user!.id,
        category: this.determineCategory(topic),
        estimatedTime: Math.ceil(
          (numQuestions * QuizController.ESTIMATED_TIME_PER_QUESTION) / 60
        ), // Convert seconds to minutes and round up
        tags: [topic, difficulty, this.determineCategory(topic)],
        metadata: {
          totalAttempts: 0,
          averageScore: 0,
          averageTime: 0,
          successRate: 0,
        },
      });

      await quiz.save();

      // Create quiz session
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const totalTime =
        numQuestions * QuizController.ESTIMATED_TIME_PER_QUESTION; // seconds

      const quizSession = new QuizSession({
        userId: req.user!.id,
        quizId: quiz._id,
        sessionToken,
        startedAt: new Date(),
        status: "active",
        selectedAnswers: new Map(),
        timeRemaining: totalTime,
        totalQuestions: numQuestions,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      await quizSession.save();

      res.json({
        success: true,
        data: {
          quizId: quiz._id,
          sessionToken,
          questions: result.questions,
          metadata: result.metadata,
          totalTime,
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Quiz generation error:", error);
      // Log the full error details
      console.error("Quiz generation error details:", {
        error,
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
        message: msg,
      });

      // Handle OpenAI specific errors
      if (msg.includes("exceeded your current quota")) {
        return res.status(402).json({
          success: false,
          error: "OpenAI API quota exceeded. Please try again later.",
        });
      }

      res.status(500).json({
        success: false,
        error: msg || "Failed to generate quiz. Please try again.",
        details:
          process.env.NODE_ENV === "development"
            ? extractErrorMessage(error)
            : undefined,
      });
    }
  };

  saveQuizResult = async (req: AuthRequest, res: Response) => {
    try {
      const {
        quizId,
        score,
        totalQuestions,
        timeTaken,
        selectedAnswers: rawSelectedAnswers,
        status = "completed",
        analytics,
        feedback,
      } = req.body;

      // Validate quiz exists
      const quiz = await Quiz.findOne({ _id: quizId });
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "Quiz not found",
        });
      }

      // Transform rawSelectedAnswers to Map<string, string>
      const transformedSelectedAnswers = new Map<string, string>();
      for (const key in rawSelectedAnswers) {
        if (Object.prototype.hasOwnProperty.call(rawSelectedAnswers, key)) {
          const questionIndex = parseInt(key, 10);
          const userAnswer = rawSelectedAnswers[key];

          // Determine the question type to correctly transform the answer
          const question = quiz.questions[questionIndex];
          if (question) {
            let transformedAnswer: string;
            if (
              (question.type === "multiple-choice" ||
                question.type === "true-false") &&
              typeof userAnswer === "number"
            ) {
              // Convert numeric answer (0, 1, 2, 3) to letter ("A", "B", "C", "D")
              transformedAnswer = ["A", "B", "C", "D"][userAnswer] || "A";
            } else if (typeof userAnswer === "string") {
              transformedAnswer = userAnswer;
            } else {
              // Handle unexpected types or provide a default
              transformedAnswer = String(userAnswer);
            }
            transformedSelectedAnswers.set(key, transformedAnswer);
          }
        }
      }

      // Calculate analytics if not provided
      const calculatedAnalytics =
        analytics ||
        (await this.calculateAnalytics(
          quiz,
          transformedSelectedAnswers,
          timeTaken,
          score,
          totalQuestions
        ));

      const quizResult = new QuizResult({
        userId: req.user!.id,
        quizId,
        score,
        totalQuestions,
        selectedAnswers: transformedSelectedAnswers,
        timeTaken,
        status,
        analytics: calculatedAnalytics,
        feedback,
      });

      await quizResult.save();

      // Update quiz statistics
      await this.updateQuizStatistics(quiz, score, timeTaken, totalQuestions);

      res.json({
        success: true,
        data: {
          resultId: quizResult._id,
          score,
          totalQuestions,
          analytics: quizResult.analytics,
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Save quiz result error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to save quiz result",
      });
    }
  };

  getQuizAnalytics = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const results = await QuizResult.find({ userId }).sort({
        completedAt: -1,
      });

      if (results.length === 0) {
        return res.json({
          message: "Analytics retrieved successfully",
          data: {
            totalQuizzes: 0,
            averageScore: 0,
            averageTime: 0,
            scoreRanges: { "0-50": 0, "50-80": 0, "80-100": 0 },
            performanceByDifficulty: {
              easy: { average: 0 },
              medium: { average: 0 },
              hard: { average: 0 },
            },
            performanceByQuestionType: {
              "multiple-choice": { average: 0 },
              "true-false": { average: 0 },
              "fill-in-the-blank": { average: 0 },
            },
            recentResults: [],
          },
        });
      }

      const totalQuizzes = results.length;
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const totalQuestions = results[0]!.totalQuestions;
      const averageScore = Math.round(
        ((totalScore / totalQuizzes) * 100) / totalQuestions
      );
      const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
      const averageTime = Math.round(totalTime / totalQuizzes);

      const scoreRanges = { "0-50": 0, "50-80": 0, "80-100": 0 };
      results.forEach((r) => {
        const percentage = Math.round((r.score / r.totalQuestions) * 100);
        if (percentage <= 50) scoreRanges["0-50"]++;
        else if (percentage <= 80) scoreRanges["50-80"]++;
        else scoreRanges["80-100"]++;
      });

      const performanceByDifficulty = {
        easy: { average: 0, count: 0 },
        medium: { average: 0, count: 0 },
        hard: { average: 0, count: 0 },
      };

      const performanceByQuestionType = {
        "multiple-choice": { average: 0, count: 0 },
        "true-false": { average: 0, count: 0 },
        "fill-in-the-blank": { average: 0, count: 0 },
      };

      // For simplicity, assume difficulty and question types are not stored per result
      // In a real app, you'd need to populate or store this data
      // For now, set defaults

      const recentResults = results.slice(0, 10).map((r) => ({
        date: r.completedAt
          ? new Date(r.completedAt).toLocaleDateString()
          : "N/A",
        score: r.score,
        totalQuestions: r.totalQuestions,
        percentage: Math.round((r.score / r.totalQuestions) * 100),
      }));

      res.json({
        message: "Analytics retrieved successfully",
        data: {
          totalQuizzes,
          averageScore,
          averageTime,
          scoreRanges,
          performanceByDifficulty: {
            easy: { average: performanceByDifficulty.easy.average },
            medium: { average: performanceByDifficulty.medium.average },
            hard: { average: performanceByDifficulty.hard.average },
          },
          performanceByQuestionType: {
            "multiple-choice": {
              average: performanceByQuestionType["multiple-choice"].average,
            },
            "true-false": {
              average: performanceByQuestionType["true-false"].average,
            },
            "fill-in-the-blank": {
              average: performanceByQuestionType["fill-in-the-blank"].average,
            },
          },
          recentResults,
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get analytics error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get analytics",
      });
    }
  };

  private async calculateAnalytics(
    quiz: IQuiz,
    selectedAnswers: Map<string, string>,
    timeTaken: number,
    score: number,
    totalQuestions: number
  ) {
    const difficultyBreakdown = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };
    const questionTypeBreakdown = {
      "multiple-choice": { correct: 0, total: 0 },
      "true-false": { correct: 0, total: 0 },
      "fill-in-the-blank": { correct: 0, total: 0 },
    };

    let currentStreak = 0;
    let longestStreak = 0;
    const streakBreakdown: number[] = [];

    quiz.questions.forEach((question, index) => {
      const userAnswer = selectedAnswers.get(index.toString());
      const isCorrect = this.checkAnswerCorrectness(question, userAnswer);

      // Update difficulty breakdown
      difficultyBreakdown[question.difficulty].total++;
      if (isCorrect) difficultyBreakdown[question.difficulty].correct++;

      // Update question type breakdown
      questionTypeBreakdown[question.type].total++;
      if (isCorrect) questionTypeBreakdown[question.type].correct++;

      // Update streaks
      if (isCorrect) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        if (currentStreak > 0) streakBreakdown.push(currentStreak);
        currentStreak = 0;
      }
    });

    if (currentStreak > 0) streakBreakdown.push(currentStreak);

    return {
      accuracy: Math.round((score / totalQuestions) * 100),
      averageTimePerQuestion: timeTaken / totalQuestions,
      difficultyBreakdown,
      questionTypeBreakdown,
      timeDistribution: new Map(), // Would need actual time per question data
      streak: {
        longest: longestStreak,
        current: currentStreak,
        breakdown: streakBreakdown,
      },
      areasForImprovement: this.identifyImprovementAreas(
        difficultyBreakdown,
        questionTypeBreakdown
      ),
    };
  }

  private checkAnswerCorrectness(
    question: IQuestion,
    userAnswer: string | undefined
  ): boolean {
    if (question.type === "fill-in-the-blank") {
      if (userAnswer === undefined) return false;
      const validation = validateFillInBlankAnswer(userAnswer, question.answer);
      return validation.isCorrect;
    }

    // For multiple-choice and true-false, userAnswer should be the option key (e.g., "A", "B")
    if (question.type === "multiple-choice" || question.type === "true-false") {
      if (userAnswer === undefined) return false;
      return userAnswer.toUpperCase() === question.answer.toUpperCase();
    }

    return false;
  }

  private identifyImprovementAreas(
    difficultyBreakdown: Record<string, { correct: number; total: number }>,
    questionTypeBreakdown: Record<string, { correct: number; total: number }>
  ): string[] {
    const areas: string[] = [];

    // Check difficulty areas
    Object.entries(difficultyBreakdown).forEach(([difficulty, data]) => {
      if (
        data.total > 0 &&
        data.correct / data.total < QuizController.SUCCESS_RATE_THRESHOLD
      ) {
        areas.push(`${difficulty}-difficulty`);
      }
    });

    // Check question type areas
    Object.entries(questionTypeBreakdown).forEach(([type, data]) => {
      if (
        data.total > 0 &&
        data.correct / data.total < QuizController.SUCCESS_RATE_THRESHOLD
      ) {
        areas.push(`${type}-questions`);
      }
    });

    return areas;
  }

  private async updateQuizStatistics(
    quiz: IQuiz,
    score: number,
    timeTaken: number,
    totalQuestions: number
  ) {
    quiz.metadata.totalAttempts += 1;
    quiz.metadata.averageScore =
      (quiz.metadata.averageScore * (quiz.metadata.totalAttempts - 1) + score) /
      quiz.metadata.totalAttempts;
    quiz.metadata.averageTime =
      (quiz.metadata.averageTime * (quiz.metadata.totalAttempts - 1) +
        timeTaken) /
      quiz.metadata.totalAttempts;

    const successRate =
      score / totalQuestions >= QuizController.SUCCESS_RATE_THRESHOLD ? 1 : 0;
    quiz.metadata.successRate =
      (quiz.metadata.successRate * (quiz.metadata.totalAttempts - 1) +
        successRate) /
      quiz.metadata.totalAttempts;

    await quiz.save();
  }

  private getDateFilter(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case "week":
        return new Date(now.setDate(now.getDate() - 7));
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0); // Beginning of time
    }
  }

  getAllQuizzes = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const quizzes = await Quiz.find({ userId }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: quizzes,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get all quizzes error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get quizzes",
      });
    }
  };

  getQuizById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const quiz = await Quiz.findOne({ _id: id, userId });
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "Quiz not found",
        });
      }

      res.json({
        success: true,
        data: quiz,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get quiz by ID error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get quiz",
      });
    }
  };

  getQuizResults = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const results = await QuizResult.find({ userId })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("quizId", "topic difficulty");

      const total = await QuizResult.countDocuments({ userId });

      res.json({
        message: "Quiz results retrieved successfully",
        data: results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get quiz results error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get quiz results",
      });
    }
  };

  startQuizSession = async (req: AuthRequest, res: Response) => {
    try {
      const { quizId } = req.body;
      const userId = req.user!.id;

      // Validate quiz exists
      const quiz = await Quiz.findOne({ _id: quizId });
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: "Quiz not found",
        });
      }

      // Create quiz session
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const quizSession = new QuizSession({
        userId,
        quizId,
        sessionToken,
        startedAt: new Date(),
        status: "active",
        selectedAnswers: new Map(),
        timeRemaining: 0, // Will be set based on quiz settings
        totalQuestions: quiz.questions.length,
      });

      await quizSession.save();

      res.json({
        success: true,
        data: {
          sessionToken,
          quiz: {
            id: quiz._id,
            title: quiz.title,
            questions: quiz.questions,
          },
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Start quiz session error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to start quiz session",
      });
    }
  };

  getQuizSession = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params;
      const userId = req.user!.id;

      const session = await QuizSession.findOne({ sessionToken, userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Quiz session not found",
        });
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get quiz session error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get quiz session",
      });
    }
  };

  updateQuizSession = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params;
      const { answers, currentQuestionIndex, lastActivityAt } = req.body;
      const userId = req.user!.id;

      const session = await QuizSession.findOne({ sessionToken, userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Quiz session not found",
        });
      }

      if (session.status !== "active") {
        return res.status(400).json({
          success: false,
          error: "Quiz session is not in progress",
        });
      }

      // Update answers if provided
      if (answers && typeof answers === 'object') {
        // Clear existing answers and set new ones
        session.selectedAnswers.clear();
        Object.entries(answers).forEach(([questionIndex, answer]) => {
          if (answer) {
            session.selectedAnswers.set(questionIndex.toString(), answer as string);
          }
        });
      }

      // Update current question index if provided
      if (currentQuestionIndex !== undefined) {
        session.currentQuestionIndex = currentQuestionIndex;
      }

      // Update last activity timestamp
      session.lastActivityAt = lastActivityAt ? new Date(lastActivityAt) : new Date();

      await session.save();

      res.json({
        success: true,
        data: session,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Update quiz session error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to update quiz session",
      });
    }
  };

  completeQuizSession = async (req: AuthRequest, res: Response) => {
    try {
      const { sessionToken } = req.params;
      const { finalAnswers, score } = req.body;
      const userId = req.user!.id;

      console.log("Completing quiz session:", { sessionToken, userId });

      const session = await QuizSession.findOne({ sessionToken, userId });
      if (!session) {
        console.log("Session not found:", { sessionToken, userId });
        return res.status(404).json({
          success: false,
          error: "Quiz session not found",
        });
      }

      console.log("Session found:", { sessionId: session._id, status: session.status, quizId: session.quizId });

      if (session.status === "completed") {
        console.log("Session already completed");
        return res.status(400).json({
          success: false,
          error: "Quiz session is already completed",
        });
      }

      if (session.status !== "active") {
        console.log("Session not active:", { status: session.status });
        return res.status(400).json({
          success: false,
          error: "Quiz session is not in progress",
        });
      }

      // Mark session as completed
      session.status = "completed";
      session.completedAt = new Date();

      // Update answers if provided
      if (finalAnswers) {
        for (const [key, value] of Object.entries(finalAnswers)) {
          session.selectedAnswers.set(key, value as string);
        }
      }

      await session.save();

      // Calculate score and save result
      const quiz = await Quiz.findOne({ _id: session.quizId });
      if (quiz) {
        const calculatedScore =
          score !== undefined
            ? score
            : this.calculateScore(quiz.questions, session.selectedAnswers);

        const timeTaken =
          session.completedAt.getTime() - session.startedAt.getTime();

        // Calculate analytics
        const analytics = await this.calculateAnalytics(
          quiz,
          session.selectedAnswers,
          timeTaken,
          calculatedScore,
          quiz.questions.length
        );

        const result = new QuizResult({
          userId,
          quizId: session.quizId,
          score: calculatedScore,
          totalQuestions: quiz.questions.length,
          selectedAnswers: session.selectedAnswers,
          timeTaken,
          status: "completed",
          analytics,
        });
        await result.save();

        // Update quiz statistics
        await this.updateQuizStatistics(
          quiz,
          calculatedScore,
          timeTaken,
          quiz.questions.length
        );
      }

      res.json({
        success: true,
        data: {
          score: score || 0,
          totalQuestions: quiz?.questions.length || 0,
          completedAt: session.completedAt,
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Complete quiz session error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to complete quiz session",
      });
    }
  };

  private calculateScore(
    questions: IQuestion[],
    answers: Map<string, string>
  ): number {
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswer = answers.get(index.toString());
      if (this.checkAnswerCorrectness(question, userAnswer)) {
        correct++;
      }
    });
    return correct;
  }

  deleteQuizResult = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await QuizResult.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Quiz result not found",
        });
      }

      res.json({
        success: true,
        message: "Quiz result deleted successfully",
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Delete quiz result error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to delete quiz result",
      });
    }
  };
}

// Create controller instance
const quizController = new QuizController();

// Export methods for routing
export const getQuiz = quizController.generateQuiz.bind(quizController);
export const getAllQuizzes = quizController.getAllQuizzes.bind(quizController);
export const getQuizById = quizController.getQuizById.bind(quizController);
export const saveQuizResult =
  quizController.saveQuizResult.bind(quizController);
export const getQuizResults =
  quizController.getQuizResults.bind(quizController);
export const getQuizAnalytics =
  quizController.getQuizAnalytics.bind(quizController);
export const startQuizSession =
  quizController.startQuizSession.bind(quizController);
export const getQuizSession =
  quizController.getQuizSession.bind(quizController);
export const updateQuizSession =
  quizController.updateQuizSession.bind(quizController);
export const completeQuizSession =
  quizController.completeQuizSession.bind(quizController);
export const deleteQuizResult =
  quizController.deleteQuizResult.bind(quizController);
