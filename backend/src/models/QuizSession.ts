// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Schema, Document } from "mongoose";

// Define an interface for a quiz session document, extending Mongoose's Document for database operations
export interface IQuizSession extends Document {
  userId: string; // The ID of the user taking the quiz
  quizId: string; // The ID of the quiz being taken
  currentQuestionIndex: number; // Current question being answered (0-based)
  selectedAnswers: Map<string, string>; // Mapping of question index to selected answer
  timeRemaining: number; // Time remaining in seconds
  status: "active" | "paused" | "completed" | "abandoned"; // Current status of the session
  startedAt: Date; // When the session was started
  lastActivityAt: Date; // Last time user was active in the session
  pausedAt?: Date; // When the session was last paused
  completedAt?: Date; // When the session was completed
  score?: number; // Final score (only set when completed)
  totalQuestions: number; // Total number of questions in the quiz
  sessionToken: string; // Unique token for session security
  ipAddress?: string; // IP address for security tracking
  userAgent?: string; // Browser user agent for security
}

// Define a Mongoose schema for the quiz session document, specifying field types, validation, and defaults
const QuizSessionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // User ID is required and indexed
    quizId: { type: String, required: true, index: true }, // Quiz ID is required and indexed
    currentQuestionIndex: { type: Number, default: 0, min: 0 }, // Current question index, defaults to 0
    selectedAnswers: { type: Map, of: Schema.Types.Mixed, default: {} }, // Selected answers as a map
    timeRemaining: { type: Number, required: true, min: 0 }, // Time remaining in seconds
    status: {
      type: String,
      required: true,
      enum: ["active", "paused", "completed", "abandoned"],
      default: "active",
    }, // Status with enum validation
    startedAt: { type: Date, default: Date.now }, // Automatically set to current date/time
    lastActivityAt: { type: Date, default: Date.now }, // Automatically set to current date/time
    pausedAt: { type: Date }, // Optional pause timestamp
    completedAt: { type: Date }, // Optional completion timestamp
    score: { type: Number, min: 0 }, // Optional final score
    totalQuestions: { type: Number, required: true, min: 1 }, // Total questions required and at least 1
    sessionToken: { type: String, required: true }, // Unique session token
    ipAddress: { type: String }, // Optional IP address
    userAgent: { type: String }, // Optional user agent
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Add compound indexes for common query patterns
QuizSessionSchema.index({ userId: 1, status: 1 }); // For user's active sessions
QuizSessionSchema.index({ sessionToken: 1 }, { unique: true }); // For session token lookup
QuizSessionSchema.index({ lastActivityAt: 1 }); // For cleanup of old sessions
QuizSessionSchema.index({ quizId: 1, userId: 1 }); // For quiz-specific user sessions

// Pre-save middleware to update lastActivityAt on modifications
QuizSessionSchema.pre("save", function (next) {
  if (this.isModified() && !this.isModified("lastActivityAt")) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Static method to clean up expired sessions (older than 24 hours)
QuizSessionSchema.statics.cleanupExpiredSessions = async function () {
  const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  return this.updateMany(
    {
      lastActivityAt: { $lt: expiryTime },
      status: { $in: ["active", "paused"] },
    },
    { status: "abandoned" }
  );
};

// Instance method to check if session is expired
QuizSessionSchema.methods.isExpired = function (): boolean {
  const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  return Date.now() - this.lastActivityAt.getTime() > expiryTime;
};

// Create and export a Mongoose model for the QuizSession collection
export default mongoose.model<IQuizSession>("QuizSession", QuizSessionSchema);
