import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IQuizResult extends Document {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: Map<string, string>;
  timeTaken: number;
  status: "in-progress" | "completed" | "paused" | "abandoned";
  completedAt?: Date;
  difficulty?: "easy" | "medium" | "hard";
  questionTypes?: ("multiple-choice" | "true-false" | "fill-in-the-blank")[];
  analytics: {
    accuracy: number;
    averageTimePerQuestion: number;
    difficultyBreakdown: {
      easy: { correct: number; total: number };
      medium: { correct: number; total: number };
      hard: { correct: number; total: number };
    };
    questionTypeBreakdown: {
      "multiple-choice": { correct: number; total: number };
      "true-false": { correct: number; total: number };
      "fill-in-the-blank": { correct: number; total: number };
    };
    timeDistribution: Map<string, number>;
    streak: {
      longest: number;
      current: number;
      breakdown: number[];
    };
    confidenceRating?: number;
    areasForImprovement: string[];
  };
  feedback?: {
    rating: number;
    comment?: string;
    difficultyPerception: "too-easy" | "appropriate" | "too-hard";
  };
  version: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  percentage: number;
  performanceRating: string;
}

const QuizResultSchema: Schema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    quizId: {
      type: String,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedAnswers: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
    },
    timeTaken: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["in-progress", "completed", "paused", "abandoned"],
      default: "in-progress",
      index: true,
    },
    completedAt: {
      type: Date,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
    },
    questionTypes: [
      {
        type: String,
        enum: ["multiple-choice", "true-false", "fill-in-the-blank"],
      },
    ],
    analytics: {
      accuracy: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      averageTimePerQuestion: {
        type: Number,
        required: true,
        min: 0,
      },
      difficultyBreakdown: {
        easy: {
          correct: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        medium: {
          correct: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        hard: {
          correct: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
      },
      questionTypeBreakdown: {
        "multiple-choice": {
          correct: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        "true-false": {
          correct: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
        "fill-in-the-blank": {
          correct: { type: Number, default: 0 },
          total: { type: Number, default: 0 },
        },
      },
      timeDistribution: {
        type: Map,
        of: Number,
        default: {},
      },
      streak: {
        longest: { type: Number, default: 0 },
        current: { type: Number, default: 0 },
        breakdown: [{ type: Number }],
      },
      confidenceRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      areasForImprovement: [
        {
          type: String,
        },
      ],
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        maxlength: 1000,
      },
      difficultyPerception: {
        type: String,
        enum: ["too-easy", "appropriate", "too-hard"],
      },
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for percentage score
QuizResultSchema.virtual("percentage").get(function (this: any) {
  const result = this as IQuizResult;
  return Math.round((result.score / result.totalQuestions) * 100);
});

// Virtual for performance rating
QuizResultSchema.virtual("performanceRating").get(function (this: any) {
  const result = this as IQuizResult;
  const percentage = result.percentage;
  if (percentage >= 90) return "excellent";
  if (percentage >= 75) return "good";
  if (percentage >= 60) return "average";
  return "needs-improvement";
});

// Indexes
// Optimized indexes for QuizResult queries
QuizResultSchema.index({ userId: 1, completedAt: -1 }); // User results sorted by date
QuizResultSchema.index({ quizId: 1, score: -1 }); // Quiz results by score
QuizResultSchema.index({ userId: 1, status: 1 }); // User results by status
QuizResultSchema.index({ "analytics.accuracy": -1 }); // Analytics queries
QuizResultSchema.index({ status: 1, completedAt: -1 }); // Completed results for analytics
QuizResultSchema.index({ difficulty: 1, status: 1 }); // Difficulty-based analytics
QuizResultSchema.index({ questionTypes: 1, status: 1 }); // Question type analytics
QuizResultSchema.index({ userId: 1, quizId: 1, completedAt: -1 }); // User-quiz specific results
QuizResultSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
); // Auto-delete after 1 year

// Pre-save middleware to calculate analytics
QuizResultSchema.pre<IQuizResult>("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  // Calculate accuracy
  this.analytics.accuracy = Math.round(
    (this.score / this.totalQuestions) * 100
  );

  // Calculate average time per question
  this.analytics.averageTimePerQuestion = this.timeTaken / this.totalQuestions;

  next();
});

// Static method to get user statistics
QuizResultSchema.statics.getUserStats = async function (
  this: any,
  userId: string
) {
  const stats = await this.aggregate([
    { $match: { userId, status: "completed" } },
    {
      $group: {
        _id: "$userId",
        totalQuizzes: { $sum: 1 },
        averageScore: { $avg: "$score" },
        averageAccuracy: { $avg: "$analytics.accuracy" },
        totalTimeSpent: { $sum: "$timeTaken" },
        bestScore: { $max: "$score" },
        recentQuizzes: {
          $push: {
            quizId: "$quizId",
            score: "$score",
            completedAt: "$completedAt",
          },
        },
      },
    },
  ]);

  return stats[0] || null;
};

// Instance method to generate insights
QuizResultSchema.methods.generateInsights = function (
  this: IQuizResult
): string[] {
  const insights: string[] = [];
  const accuracy = this.analytics.accuracy;

  if (accuracy < 60) {
    insights.push("Focus on fundamental concepts and review basic materials.");
  } else if (accuracy < 80) {
    insights.push("Good understanding, but practice more complex problems.");
  } else {
    insights.push("Excellent performance! Consider more challenging topics.");
  }

  // Time management insights
  const avgTime = this.analytics.averageTimePerQuestion;
  if (avgTime > 60) {
    insights.push("Work on improving your speed and time management.");
  }

  // Difficulty-based insights
  const hardQuestions = this.analytics.difficultyBreakdown.hard;
  if (
    hardQuestions.total > 0 &&
    hardQuestions.correct / hardQuestions.total < 0.5
  ) {
    insights.push("Focus on mastering difficult concepts and advanced topics.");
  }

  return insights;
};

export default mongoose.model<IQuizResult>("QuizResult", QuizResultSchema);
