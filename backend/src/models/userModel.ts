// Import Mongoose library components for defining schemas and models, and TypeScript types for type safety
import mongoose, { Document } from "mongoose";

// Define an interface for a user document, extending Mongoose's Document for database operations
export interface IUser extends Document {
  id: string; // Virtual id field for convenience
  fullName: string; // The full name of the user
  email: string; // The email address of the user, used for login and verification
  password: string; // The hashed password for user authentication
  role: string; // The role of the user (e.g., 'myUsers' for regular users)
  isEmailVerified: boolean; // Flag indicating if the user's email has been verified
  emailVerificationToken?: string; // Optional token for email verification process
  emailVerificationExpires?: Date; // Optional expiration date for the email verification token
  passwordResetToken?: string; // Optional token for password reset process
  passwordResetExpires?: Date; // Optional expiration date for the password reset token
  // Kode10x quiz fields
  school?: mongoose.Types.ObjectId; // Reference to school
  totalScore: number; // Total score from Kode10x quizzes
  completedQuizzes: {
    quizSessionId: string;
    score: number;
    subject: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    completedAt: Date;
  }[];
}

// Define a Mongoose schema for the user document, specifying field types, validation, and defaults
export const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: { type: String, required: true }, // Full name is a required string field
    email: { type: String, required: true }, // Email is a required string field
    password: { type: String, required: true }, // Password is a required string field
    role: { type: String, default: "myUsers" }, // Role defaults to "myUsers" if not specified
    isEmailVerified: { type: Boolean, default: false }, // Email verification flag defaults to false
    emailVerificationToken: { type: String }, // Optional string field for verification token
    emailVerificationExpires: { type: Date }, // Optional date field for token expiration
    passwordResetToken: { type: String }, // Optional string field for password reset token
    passwordResetExpires: { type: Date }, // Optional date field for password reset token expiration
    // Kode10x quiz fields
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    completedQuizzes: [{
      quizSessionId: { type: String },
      score: { type: Number, required: true },
      subject: { type: String },
      totalQuestions: { type: Number },
      correctAnswers: { type: Number },
      incorrectAnswers: { type: Number },
      skippedQuestions: { type: Number },
      completedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields to the schema
);

// Add virtual id field
userSchema.virtual('id').get(function() {
  return (this as any)._id.toString();
});

// Ensure virtual fields are serialised
userSchema.set('toJSON', {
  virtuals: true,
});

// Create and export a Mongoose model for the myUsers collection, using the defined schema and interface
export const userModel = mongoose.model<IUser>("myUsers", userSchema);
