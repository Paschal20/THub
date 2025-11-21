import mongoose, { Document } from "mongoose";

export interface IKode10xQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  userAnswer?: string;
  correctAnswer: string;
  incorrectAnswer?: string;
  isCorrect: boolean;
  quizSessionId: string;
  answeredAt: Date;
}

const kode10xQuizAttemptSchema = new mongoose.Schema<IKode10xQuizAttempt>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'myUsers', required: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Kode10xQuestion", required: true },
    userAnswer: { type: String },
    correctAnswer: { type: String },
    incorrectAnswer: { type: String },
    isCorrect: { type: Boolean },
    quizSessionId: { type: String },
    answeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Kode10xQuizAttempt = mongoose.model<IKode10xQuizAttempt>('Kode10xQuizAttempt', kode10xQuizAttemptSchema);