import { Request, Response } from "express";
import mongoose from "mongoose";
import { Kode10xQuestion } from "../models/Kode10xQuestion";
import { userModel } from "../models/userModel";
import { Kode10xQuizAttempt } from "../models/Kode10xQuizAttempt";

export const createQuestion = async (req: Request, res: Response) => {
  try {
    console.log("Creating question", req.body);
    const { questionText, options, correctAnswer, subject } = req.body;

    if (!questionText || !options || options.length < 2 || options.length > 5 || !correctAnswer) {
      return res.status(409).json({ message: "Invalid question data" });
    }

    const newQuestion = new Kode10xQuestion({
      questionText,
      options,
      correctAnswer,
      subject,
    });
    await newQuestion.save();

    return res
      .status(201)
      .json({ message: "Question created successfully", data: newQuestion });
  } catch (err: any) {
    console.log(err)
    return res
      .status(500)
      .json({ message: "An error occurred", error: err.message });
  }
};

export const getRandomQuestion = async (req: Request, res: Response) => {
  try {
    const { subject } = req.params;

    // Fetch all questions that match the subject
    const allQuestions = await Kode10xQuestion.find({ subject });

    // For testing, add dummy questions if none
    if (allQuestions.length < 1) {
      allQuestions.push({
        _id: "dummy1",
        questionText: "What is 1+2?",
        options: ["3", "4", "5"],
        subject: subject,
        correctAnswer: "3"
      } as any);
    }

    if (allQuestions.length < 1) {
      return res
        .status(404)
        .json({ message: `No questions found for subject: ${subject}` });
    }

    // Determine how many to pick (max 20 or less if not enough)
    const limit = Math.min(20, allQuestions.length);

    const selectedQuestions = [];
    const selectedQuestionIds = new Set();

    while (selectedQuestions.length < limit) {
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      const randomQuestion = allQuestions[randomIndex];

      if (randomQuestion && !selectedQuestionIds.has(randomQuestion._id.toString())) {
        selectedQuestions.push({
          _id: randomQuestion._id,
          questionText: randomQuestion.questionText,
          options: randomQuestion.options,
          subject: randomQuestion.subject,
        });
        selectedQuestionIds.add(randomQuestion._id.toString());
      }
    }

    res.status(200).json({
      message: `Questions for ${subject} fetched successfully`,
      selectedQuestions,
    });
  } catch (err: any) {
    res.status(500).json({
      message: "An error occurred while fetching questions",
      error: err.message,
    });
  }
};

export const getAllQuestionsWithAnswers = async (req: Request, res: Response) => {
  try {
    const allQuestions = await Kode10xQuestion.find();

    if (!allQuestions || allQuestions.length === 0) {
      return res.status(404).json({ message: "No questions found" });
    }

    const questionsWithAnswers = allQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      subject: q.subject,
    }));

    res
      .status(200)
      .json({ message: "All questions gotten", data: questionsWithAnswers });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Kode10xQuestion.distinct("subject");

    // For testing, add dummy subjects if none
    const allSubjects = subjects.filter(Boolean);
    if (allSubjects.length === 0) {
      allSubjects.push("Math", "Science", "History");
    }

    res.status(200).json({
      message: "Subjects fetched successfully",
      subjects: allSubjects,
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getQuizHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { subject, startDate, endDate } = req.query;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter completed quizzes by subject and date
    let filteredQuizzes = user.completedQuizzes;
    if (subject) {
      filteredQuizzes = filteredQuizzes.filter(q => q.subject === subject);
    }
    if (startDate || endDate) {
      filteredQuizzes = filteredQuizzes.filter(q => {
        const quizDate = new Date(q.completedAt);
        if (startDate && quizDate < new Date(startDate as string)) return false;
        if (endDate && quizDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    // Build quiz sessions from completedQuizzes
    const quizSessions = await Promise.all(filteredQuizzes.map(async (quiz) => {
      // Try to get detailed attempts for this session
      const attempts = await Kode10xQuizAttempt.find({
        userId,
        quizSessionId: quiz.quizSessionId
      }).populate('questionId');

      const subjects = attempts.length > 0
        ? [...new Set(attempts.map((a: any) => a.questionId?.subject).filter(Boolean))]
        : [quiz.subject];

      return {
        sessionId: quiz.quizSessionId,
        date: quiz.completedAt,
        totalQuestions: quiz.totalQuestions,
        correctAnswers: quiz.correctAnswers,
        incorrectAnswers: quiz.incorrectAnswers,
        score: quiz.score,
        successRate: quiz.totalQuestions > 0 ? ((quiz.correctAnswers / quiz.totalQuestions) * 100).toFixed(2) + '%' : '0%',
        subjects: subjects,
        attempts: attempts.map((a: any) => ({
          questionText: a.questionId?.questionText,
          userAnswer: a.userAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect,
          subject: a.questionId?.subject
        }))
      };
    }));

    // Calculate subject-wise performance from completed quizzes
    const subjectPerformance: { [key: string]: { total: number; correct: number; incorrect: number } } = {};
    filteredQuizzes.forEach((quiz) => {
      const subj = quiz.subject || 'Unknown';
      if (!subjectPerformance[subj]) {
        subjectPerformance[subj] = { total: 0, correct: 0, incorrect: 0 };
      }
      subjectPerformance[subj].total += quiz.totalQuestions;
      subjectPerformance[subj].correct += quiz.correctAnswers;
      subjectPerformance[subj].incorrect += quiz.incorrectAnswers;
    });

    const subjectStats = Object.entries(subjectPerformance).map(([subject, stats]) => ({
      subject,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      incorrectAnswers: stats.incorrect,
      successRate: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(2) + '%' : '0%',
      score: stats.correct * 10
    }));

    // Overall statistics from completed quizzes
    const totalQuizzes = filteredQuizzes.length;
    const totalQuestionsAttempted = filteredQuizzes.reduce((sum, q) => sum + q.totalQuestions, 0);
    const totalCorrect = filteredQuizzes.reduce((sum, q) => sum + q.correctAnswers, 0);
    const totalIncorrect = filteredQuizzes.reduce((sum, q) => sum + q.incorrectAnswers, 0);

    res.status(200).json({
      message: "Quiz history fetched successfully",
      data: {
        user: {
          fullName: user.fullName,
          email: user.email,
          totalScore: user.totalScore,
        },
        overallStats: {
          totalQuizzesTaken: totalQuizzes,
          totalQuestionsAttempted,
          totalCorrectAnswers: totalCorrect,
          totalIncorrectAnswers: totalIncorrect,
          overallSuccessRate: totalQuestionsAttempted > 0
            ? ((totalCorrect / totalQuestionsAttempted) * 100).toFixed(2) + '%'
            : '0%',
        },
        subjectPerformance: subjectStats,
        quizSessions: quizSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const getUserResults = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the latest quiz session ID from user's completed quizzes
    const latestQuiz = user.completedQuizzes[user.completedQuizzes.length - 1];
    if (!latestQuiz) {
      return res.status(404).json({ message: "No quiz attempts found" });
    }

    const latestSessionId = latestQuiz.quizSessionId;

    // Get all attempts from the latest session
    const latestQuizAttempts = await Kode10xQuizAttempt.find({
      userId,
      quizSessionId: latestSessionId
    }).populate('questionId');

    // Use stored values from completedQuizzes as source of truth
    const correctAnswers = latestQuiz.correctAnswers;
    const incorrectAnswers = latestQuiz.incorrectAnswers;
    const skippedAnswers = latestQuiz.skippedQuestions;

    const failedQuestions = latestQuizAttempts
      .filter((a: any) => !a.isCorrect && a.userAnswer)
      .map((a: any) => ({
        questionText: a.questionId?.questionText,
        userAnswer: a.userAnswer,
        correctAnswer: a.correctAnswer,
        subject: a.questionId?.subject,
      }));

    const skippedQuestions = latestQuizAttempts
      .filter((a: any) => !a.userAnswer)
      .map((a: any) => ({
        questionText: a.questionId?.questionText,
        correctAnswer: a.correctAnswer,
        subject: a.questionId?.subject,
      }));

    res.status(200).json({
      message: "Latest quiz results fetched successfully",
      data: {
        user: {
          fullName: user.fullName,
          email: user.email,
          totalScore: user.totalScore,
        },
        latestQuiz: {
          totalScore: latestQuiz.score,
          subject: latestQuiz.subject,
          totalQuestions: latestQuiz.totalQuestions,
          correctAnswers,
          successRate: latestQuiz.totalQuestions > 0 ? ((correctAnswers / latestQuiz.totalQuestions) * 100).toFixed(2) + '%' : '0%',
          completedAt: latestQuiz.completedAt,
        },
        failedQuestions,
        skippedQuestions,
        quizHistory: user.completedQuizzes,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

export const submitQuiz = async (req: Request, res: Response) => {
  const { userId, answers, presentedQuestions, subject } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const quizSessionId = `${userId}_${Date.now()}`;
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;
    let skippedCount = 0;
    const results = [];
    const correctAnswersList: { [key: string]: string } = {};
    const answeredQuestionIds = new Set();

    for (const answer of answers) {
      if (!mongoose.isValidObjectId(answer.questionId)) {
        // Handle dummy questions
        if (answer.questionId === "dummy1") {
          console.log("Dummy answer:", answer.userAnswer);
          if (answer.userAnswer === "3") {
            correctAnswersCount++;
            console.log("Correct, count:", correctAnswersCount);
          } else {
            incorrectAnswersCount++;
            console.log("Incorrect, count:", incorrectAnswersCount);
          }
        }
        continue;
      }
      const question = await Kode10xQuestion.findById(answer.questionId);
      if (question) {
        answeredQuestionIds.add(answer.questionId.toString());

        const isCorrect =
          answer.userAnswer &&
          answer.userAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();

        let incorrectAnswerValue = null;
        if (!isCorrect && answer.userAnswer) {
          incorrectAnswerValue = answer.userAnswer;
        }

        await Kode10xQuizAttempt.create({
          userId: userId,
          questionId: question._id,
          userAnswer: answer.userAnswer,
          correctAnswer: question.correctAnswer,
          incorrectAnswer: incorrectAnswerValue,
          isCorrect: isCorrect,
          quizSessionId: quizSessionId,
        });

        if (isCorrect) {
          correctAnswersCount++;
        } else {
          incorrectAnswersCount++;
        }

        results.push({
          questionId: question._id,
          isCorrect: isCorrect,
        });
        correctAnswersList[question._id.toString()] = question.correctAnswer;
      } else {
        // Handle case where question not found
        console.warn(`Question with id ${answer.questionId} not found`);
      }
    }

    // Calculate and save skipped questions
    const skippedQuestions = [];
    if (presentedQuestions && Array.isArray(presentedQuestions)) {
      for (const questionId of presentedQuestions) {
        if (!answeredQuestionIds.has(questionId.toString())) {
          if (!mongoose.isValidObjectId(questionId)) {
            // Dummy skipped
            skippedCount++;
            continue;
          }
          const question = await Kode10xQuestion.findById(questionId);
          if (question) {
            // Save skipped question to database
            await Kode10xQuizAttempt.create({
              userId: userId,
              questionId: question._id,
              userAnswer: null,
              correctAnswer: question.correctAnswer,
              incorrectAnswer: null,
              isCorrect: false,
              quizSessionId: quizSessionId,
            });

            skippedQuestions.push({
              questionId: question._id,
              questionText: question.questionText,
              correctAnswer: question.correctAnswer
            });
            skippedCount++;
          }
        }
      }
    }

    const score = correctAnswersCount * 10;

    user.totalScore += score;
    user.completedQuizzes.push({
      quizSessionId: quizSessionId,
      score: score,
      subject: subject || 'General',
      totalQuestions: presentedQuestions ? presentedQuestions.length : answers.length,
      correctAnswers: correctAnswersCount,
      incorrectAnswers: incorrectAnswersCount,
      skippedQuestions: skippedCount,
      completedAt: new Date()
    });
    await user.save();

    res.json({
      message: "Quiz submitted",
      score,
      totalQuestions: presentedQuestions ? presentedQuestions.length : answers.length,
      correctAnswers: correctAnswersCount,
      incorrectAnswers: incorrectAnswersCount,
      skippedQuestions: skippedCount,
      results: results,
      correctAnswersList: correctAnswersList,
      skippedQuestionsList: skippedQuestions
    });
  } catch (err: any) {
    console.error("Error during submitQuiz:", err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};