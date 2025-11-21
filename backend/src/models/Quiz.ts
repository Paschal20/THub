// // Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
// import mongoose, { Schema, Document } from "mongoose";

// // Define an interface for a quiz document, extending Mongoose's Document for database operations
// export interface IQuiz extends Document {
//   title?: string; // Optional title of the quiz
//   topic?: string; // Optional topic or subject of the quiz
//   source: string; // The source of the quiz content (e.g., topic name or file name)
//   difficulty: "easy" | "medium" | "hard"; // Difficulty level of the quiz
//   numQuestions: number; // Number of questions in the quiz
//   questions: {
//     // Array of question objects
//     question: string; // The question text
//     options: { A: string; B: string; C: string; D: string }; // Multiple choice options labeled A, B, C, D
//     answer: string; // The correct answer key (A-D for multiple-choice/true-false, text for fill-in-the-blank)
//     explanation: string; // Explanation for the correct answer
//     type: "multiple-choice" | "true-false" | "fill-in-the-blank"; // Type of question
//   }[];
//   userId: string; // The ID of the user who created or owns the quiz
//   tags?: string[]; // Optional tags for categorization
//   category?: string; // Optional category
//   isPublic?: boolean; // Whether the quiz is publicly shareable
//   isTemplate?: boolean; // Whether this quiz serves as a template
//   estimatedTime?: number; // Estimated time to complete in minutes
//   language?: string; // Language of the quiz content
//   createdAt: Date; // Timestamp for when the quiz was created (automatically managed by Mongoose)
//   updatedAt: Date; // Timestamp for when the quiz was last updated (automatically managed by Mongoose)
// }

// // Define a Mongoose schema for the quiz document, specifying field types, validation, and defaults
// const QuizSchema: Schema = new Schema(
//   {
//     title: { type: String, trim: true }, // Optional title
//     topic: { type: String }, // Topic is an optional string field
//     source: { type: String, required: true }, // Source is a required string field
//     difficulty: {
//       type: String,
//       required: true,
//       enum: ["easy", "medium", "hard"],
//     }, // Difficulty with enum validation
//     numQuestions: { type: Number, required: true }, // Number of questions is a required number field
//     userId: { type: String, required: true }, // User ID is a required string field
//     tags: [{ type: String, trim: true, lowercase: true }], // Array of tags
//     category: { type: String, trim: true }, // Optional category
//     isPublic: { type: Boolean, default: false }, // Public visibility
//     isTemplate: { type: Boolean, default: false }, // Template flag
//     estimatedTime: { type: Number, min: 1, max: 180 }, // Estimated time in minutes
//     language: { type: String, default: "en", maxlength: 5 }, // Language code
//     questions: [
//       {
//         // Questions is an array of subdocuments
//         question: { type: String, required: true }, // Question text is a required string field
//         options: {
//           // Options is an object with string fields for each choice (not all required for different question types)
//           A: {
//             type: String,
//             required: function (this: any) {
//               return this.type !== "fill-in-the-blank";
//             },
//           }, // A required for multiple-choice and true-false
//           B: {
//             type: String,
//             required: function (this: any) {
//               return this.type !== "fill-in-the-blank";
//             },
//           }, // B required for multiple-choice and true-false
//           C: {
//             type: String,
//             required: function (this: any) {
//               return this.type === "multiple-choice";
//             },
//           }, // C required only for multiple-choice
//           D: {
//             type: String,
//             required: function (this: any) {
//               return this.type === "multiple-choice";
//             },
//           }, // D required only for multiple-choice
//         },
//         answer: { type: String, required: true }, // Answer can be A-D for multiple-choice/true-false or text for fill-in-the-blank
//         explanation: { type: String, required: true }, // Explanation is a required string field
//         type: {
//           type: String,
//           required: true,
//           enum: ["multiple-choice", "true-false", "fill-in-the-blank"],
//           default: "multiple-choice",
//         }, // Question type with enum validation
//       },
//     ],
//   },
//   {
//     timestamps: true, // Automatically add createdAt and updatedAt fields to the schema
//   }
// );

// // Add indexes for better query performance
// QuizSchema.index({ userId: 1, createdAt: -1 }); // User's quizzes sorted by date
// QuizSchema.index({ isPublic: 1, createdAt: -1 }); // Public quizzes
// QuizSchema.index({ tags: 1 }); // Tag-based search
// QuizSchema.index({ category: 1 }); // Category filtering
// QuizSchema.index({ difficulty: 1 }); // Difficulty filtering

// // Create and export a Mongoose model for the Quiz collection, using the defined schema and interface
// export default mongoose.model<IQuiz>("Quiz", QuizSchema);

import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IQuiz extends Document {
  _id: string;
  title: string;
  topic: string;
  source: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questions: IQuestion[];
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
}

export interface IQuestion {
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

const QuestionSchema: Schema = new Schema({
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

const QuizSchema: Schema = new Schema(
  {
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
    questions: [QuestionSchema],
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
      totalAttempts: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0, min: 0, max: 100 },
      averageTime: { type: Number, default: 0 },
      successRate: { type: Number, default: 0, min: 0, max: 100 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for quiz duration
QuizSchema.virtual("duration").get(function (this: IQuiz) {
  return this.questions.reduce(
    (total: number, q: IQuestion) => total + (q.timeLimit || 30),
    0
  );
});

// Optimized indexes for Quiz queries
QuizSchema.index({ userId: 1, createdAt: -1 }); // User's quizzes sorted by date
QuizSchema.index({ isPublic: 1, difficulty: 1, category: 1 }); // Public quiz filtering
QuizSchema.index({ tags: 1, status: 1 }); // Tag and status filtering
QuizSchema.index({ "metadata.averageScore": -1 }); // Popular quizzes by score
QuizSchema.index({ "metadata.totalAttempts": -1 }); // Popular quizzes by attempts
QuizSchema.index({ topic: "text", title: "text" }); // Text search on topic and title
QuizSchema.index({ category: 1, difficulty: 1, "metadata.averageScore": -1 }); // Category/difficulty with score sorting
QuizSchema.index({ userId: 1, status: 1, createdAt: -1 }); // User's quizzes by status

// Pre-save middleware for validation
QuizSchema.pre<IQuiz>("save", function (next) {
  // Allow quizzes to have fewer questions than requested (numQuestions is now the requested amount, not actual count)
  // Only validate that we have at least 1 question
  if (this.questions.length < 1) {
    next(new Error("Quiz must have at least 1 question"));
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
QuizSchema.statics.findByDifficultyAndCategory = function (
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
QuizSchema.methods.updateStatistics = function (
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

export default mongoose.model<IQuiz>("Quiz", QuizSchema);
