import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ICBTQuizSession extends Document {
  _id: string;
  userId: string;
  quizId: string;
  sessionToken: string;
  status: "active" | "paused" | "completed" | "expired" | "abandoned";
  currentQuestionIndex: number;
  answers: Map<string, string>; // questionId -> selectedAnswer
  timeRemaining: number; // in seconds
  timeSpent: number; // in seconds
  startTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  metadata: {
    browserInfo?: string;
    ipAddress?: string;
    deviceInfo?: string;
    totalPauses: number;
    totalResumes: number;
    flaggedQuestions: string[]; // question IDs that were flagged for review
  };
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  pause(): void;
  resume(): void;
  submitAnswer(questionId: string, answer: string): void;
  flagQuestion(questionId: string): void;
  unflagQuestion(questionId: string): void;
}

interface ICBTQuizSessionModel extends Model<ICBTQuizSession> {
  findActiveByUserAndQuiz(userId: string, quizId: string): Promise<ICBTQuizSession | null>;
  cleanupExpiredSessions(): Promise<any>;
}

const CBTQuizSessionSchema: Schema = new Schema(
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
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "paused", "completed", "expired", "abandoned"],
      default: "active",
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    timeRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    metadata: {
      browserInfo: String,
      ipAddress: String,
      deviceInfo: String,
      totalPauses: { type: Number, default: 0 },
      totalResumes: { type: Number, default: 0 },
      flaggedQuestions: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
CBTQuizSessionSchema.index({ userId: 1, status: 1 });
CBTQuizSessionSchema.index({ quizId: 1, status: 1 });
CBTQuizSessionSchema.index({ sessionToken: 1, status: 1 });

// Pre-save middleware to update lastActivity
CBTQuizSessionSchema.pre<ICBTQuizSession>("save", function (next) {
  this.lastActivity = new Date();
  next();
});

// Instance methods
CBTQuizSessionSchema.methods.pause = function (this: ICBTQuizSession): void {
  if (this.status === "active") {
    this.status = "paused";
    this.metadata.totalPauses += 1;
  }
};

CBTQuizSessionSchema.methods.resume = function (this: ICBTQuizSession): void {
  if (this.status === "paused") {
    this.status = "active";
    this.metadata.totalResumes += 1;
  }
};

CBTQuizSessionSchema.methods.submitAnswer = function (
  this: ICBTQuizSession,
  questionId: string,
  answer: string
): void {
  this.answers.set(questionId, answer);
  this.lastActivity = new Date();
};

CBTQuizSessionSchema.methods.flagQuestion = function (
  this: ICBTQuizSession,
  questionId: string
): void {
  if (!this.metadata.flaggedQuestions.includes(questionId)) {
    this.metadata.flaggedQuestions.push(questionId);
  }
};

CBTQuizSessionSchema.methods.unflagQuestion = function (
  this: ICBTQuizSession,
  questionId: string
): void {
  const index = this.metadata.flaggedQuestions.indexOf(questionId);
  if (index > -1) {
    this.metadata.flaggedQuestions.splice(index, 1);
  }
};

// Static methods
CBTQuizSessionSchema.statics.findActiveByUserAndQuiz = function (
  userId: string,
  quizId: string
) {
  return this.findOne({
    userId,
    quizId,
    status: { $in: ["active", "paused"] },
    expiresAt: { $gt: new Date() },
  });
};

CBTQuizSessionSchema.statics.cleanupExpiredSessions = function () {
  return this.updateMany(
    {
      status: { $in: ["active", "paused"] },
      expiresAt: { $lt: new Date() },
    },
    { status: "expired" }
  );
};

const CBTQuizSession = mongoose.model<ICBTQuizSession, ICBTQuizSessionModel>("CBTQuizSession", CBTQuizSessionSchema);

export default CBTQuizSession;