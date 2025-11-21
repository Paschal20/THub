import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICBTQuizResult extends Document {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: Map<string, string>;
  timeTaken: number;
  status: "in-progress" | "completed" | "paused" | "abandoned";
  completedAt?: Date;
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
  // Instance methods
  generateInsights(): any;
}

interface ICBTQuizResultModel extends Model<ICBTQuizResult> {
  getUserStats(userId: string): Promise<any>;
}

const CBTQuizResultSchema: Schema = new Schema(
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
CBTQuizResultSchema.virtual("percentage").get(function (this: any) {
  const result = this as ICBTQuizResult;
  return Math.round((result.score / result.totalQuestions) * 100);
});

// Virtual for performance rating
CBTQuizResultSchema.virtual("performanceRating").get(function (this: any) {
  const result = this as ICBTQuizResult;
  const percentage = result.percentage;
  if (percentage >= 90) return "excellent";
  if (percentage >= 75) return "good";
  if (percentage >= 60) return "average";
  return "needs-improvement";
});

// Indexes
CBTQuizResultSchema.index({ userId: 1, completedAt: -1 });
CBTQuizResultSchema.index({ quizId: 1, score: -1 });
CBTQuizResultSchema.index({ userId: 1, status: 1 });
CBTQuizResultSchema.index({ "analytics.accuracy": -1 });
CBTQuizResultSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
); // Auto-delete after 1 year

// Pre-save middleware to calculate analytics
CBTQuizResultSchema.pre<ICBTQuizResult>("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  // Ensure analytics object exists
  if (!this.analytics) {
    this.analytics = {
      accuracy: 0,
      averageTimePerQuestion: 0,
      difficultyBreakdown: {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 },
      },
      questionTypeBreakdown: {
        "multiple-choice": { correct: 0, total: 0 },
        "true-false": { correct: 0, total: 0 },
        "fill-in-the-blank": { correct: 0, total: 0 },
      },
      timeDistribution: new Map(),
      streak: {
        longest: 0,
        current: 0,
        breakdown: [],
      },
      areasForImprovement: [],
    } as any;
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
CBTQuizResultSchema.statics.getUserStats = async function (
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
CBTQuizResultSchema.methods.generateInsights = function (
  this: ICBTQuizResult
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

const CBTQuizResult = mongoose.model<ICBTQuizResult, ICBTQuizResultModel>("CBTQuizResult", CBTQuizResultSchema);

export default CBTQuizResult;