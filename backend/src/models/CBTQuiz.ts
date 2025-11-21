import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICBTQuestion {
  _id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimit?: number;
  tags: string[];
  hints?: string[];
}

export interface ICBTQuiz extends Document {
  _id: string;
  title: string;
  topic: string;
  source: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questions: ICBTQuestion[];
  userId: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  isTemplate: boolean;
  estimatedTime: number;
  language: string;
  version: number;
  status: "draft" | "published" | "archived";
  metadata: {
    totalAttempts: number;
    averageScore: number;
    averageTime: number;
    successRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  updateStatistics(score: number, timeTaken: number, totalQuestions: number): void;
}

interface ICBTQuizModel extends Model<ICBTQuiz> {
  findByDifficultyAndCategory(difficulty: string, category: string, limit?: number): Promise<ICBTQuiz[]>;
}

const CBTQuestionSchema: Schema = new Schema({
  _id: { type: String, default: uuidv4 },
  question: { type: String, required: true, trim: true, maxlength: 1000 },
  options: {
    A: { type: String, required: true, trim: true },
    B: { type: String, required: true, trim: true },
    C: {
      type: String,
      required: function (this: any) {
        return this.type === "multiple-choice";
      },
    },
    D: {
      type: String,
      required: function (this: any) {
        return this.type === "multiple-choice";
      },
    },
  },
  answer: { type: String, required: true },
  explanation: { type: String, required: true, maxlength: 500 },
  type: {
    type: String,
    required: true,
    enum: ["multiple-choice", "true-false", "fill-in-the-blank"],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ["easy", "medium", "hard"],
  },
  points: { type: Number, default: 1, min: 1, max: 10 },
  timeLimit: { type: Number, min: 10, max: 300 },
  tags: [{ type: String, trim: true }],
  hints: [{ type: String, trim: true }],
});

const CBTQuizSchema: Schema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text",
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: "text",
    },
    source: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      index: true,
    },
    numQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    questions: [CBTQuestionSchema],
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    estimatedTime: {
      type: Number,
      required: true,
      min: 1,
      max: 480,
    },
    language: {
      type: String,
      default: "en",
      maxlength: 5,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    metadata: {
      type: {
        totalAttempts: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0, min: 0, max: 100 },
        averageTime: { type: Number, default: 0 },
        successRate: { type: Number, default: 0, min: 0, max: 100 },
      },
      default: {
        totalAttempts: 0,
        averageScore: 0,
        averageTime: 0,
        successRate: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for quiz duration
CBTQuizSchema.virtual("duration").get(function (this: ICBTQuiz) {
  return this.questions.reduce(
    (total: number, q: ICBTQuestion) => total + (q.timeLimit || 30),
    0
  );
});

// Indexes for optimized queries
CBTQuizSchema.index({ userId: 1, createdAt: -1 });
CBTQuizSchema.index({ isPublic: 1, difficulty: 1, category: 1 });
CBTQuizSchema.index({ tags: 1, status: 1 });
CBTQuizSchema.index({ "metadata.averageScore": -1 });
CBTQuizSchema.index({ "metadata.totalAttempts": -1 });

// Pre-save middleware for validation
CBTQuizSchema.pre<ICBTQuiz>("save", function (next) {
  if (this.questions.length !== this.numQuestions) {
    next(
      new Error(
        `Number of questions (${this.questions.length}) doesn't match numQuestions (${this.numQuestions})`
      )
    );
  }

  // Validate that all questions have unique IDs
  const questionIds = new Set();
  for (const question of this.questions) {
    if (questionIds.has(question._id)) {
      next(new Error(`Duplicate question ID found: ${question._id}`));
      return;
    }
    questionIds.add(question._id);
  }

  next();
});

// Static method to find quizzes by difficulty and category
CBTQuizSchema.statics.findByDifficultyAndCategory = function (
  difficulty: string,
  category: string,
  limit: number = 10
) {
  return this.find({
    difficulty,
    category,
    isPublic: true,
    status: "published",
  })
    .limit(limit)
    .sort({ "metadata.averageScore": -1 });
};

// Instance method to update quiz statistics
CBTQuizSchema.methods.updateStatistics = function (
  score: number,
  timeTaken: number,
  totalQuestions: number
) {
  const success = score / totalQuestions >= 0.6; // 60% threshold for success

  this.metadata.totalAttempts += 1;
  this.metadata.averageScore =
    (this.metadata.averageScore * (this.metadata.totalAttempts - 1) + score) /
    this.metadata.totalAttempts;
  this.metadata.averageTime =
    (this.metadata.averageTime * (this.metadata.totalAttempts - 1) +
      timeTaken) /
    this.metadata.totalAttempts;

  if (success) {
    const currentSuccessRate =
      this.metadata.successRate * (this.metadata.totalAttempts - 1);
    this.metadata.successRate =
      (currentSuccessRate + 1) / this.metadata.totalAttempts;
  }
};

const CBTQuiz = mongoose.model<ICBTQuiz, ICBTQuizModel>("CBTQuiz", CBTQuizSchema);

export default CBTQuiz;