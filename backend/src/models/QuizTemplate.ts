import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IQuizTemplateModel extends Model<IQuizTemplate> {
  findPopular(limit?: number, category?: string, difficulty?: string): Promise<IQuizTemplate[]>;
  findByTags(tags: string[], limit?: number): Promise<IQuizTemplate[]>;
}

export interface IQuizTemplate extends Document {
  _id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questionTypes: ("multiple-choice" | "true-false" | "fill-in-the-blank")[];
  tags: string[];
  category: string;
  isPublic: boolean;
  userId: string;
  usageCount: number;
  rating: number;
  totalRatings: number;
  averageRating: number;
  language: string;
  version: number;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
  addRating(newRating: number): Promise<IQuizTemplate>;
  incrementUsage(): Promise<IQuizTemplate>;
}

const QuizTemplateSchema: Schema = new Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: "text",
    },
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
    questionTypes: [
      {
        type: String,
        enum: ["multiple-choice", "true-false", "fill-in-the-blank"],
        required: true,
      },
    ],
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
    userId: {
      type: String,
      required: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for average rating
QuizTemplateSchema.virtual("averageRating").get(function (this: IQuizTemplate) {
  return this.totalRatings > 0 ? this.rating / this.totalRatings : 0;
});

// Optimized indexes for QuizTemplate queries
QuizTemplateSchema.index({ userId: 1, createdAt: -1 }); // User's templates sorted by date
QuizTemplateSchema.index({ isPublic: 1, difficulty: 1, category: 1 }); // Public template filtering
QuizTemplateSchema.index({ tags: 1, status: 1 }); // Tag and status filtering
QuizTemplateSchema.index({ usageCount: -1 }); // Popular templates by usage
QuizTemplateSchema.index({ rating: -1 }); // Templates by rating
QuizTemplateSchema.index({ title: "text", description: "text", topic: "text" }); // Text search
QuizTemplateSchema.index({ category: 1, usageCount: -1 }); // Category with popularity
QuizTemplateSchema.index({ userId: 1, status: 1 }); // User's templates by status

// Static method to find popular templates
QuizTemplateSchema.statics.findPopular = function (
  limit: number = 10,
  category?: string,
  difficulty?: string
) {
  const query: any = {
    isPublic: true,
    status: "published",
  };

  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;

  return this.find(query)
    .limit(limit)
    .sort({ usageCount: -1, rating: -1 });
};

// Static method to find templates by tags
QuizTemplateSchema.statics.findByTags = function (
  tags: string[],
  limit: number = 20
) {
  return this.find({
    tags: { $in: tags },
    isPublic: true,
    status: "published",
  })
    .limit(limit)
    .sort({ usageCount: -1 });
};

// Instance method to increment usage count
QuizTemplateSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  return this.save();
};

// Instance method to add rating
QuizTemplateSchema.methods.addRating = function (newRating: number) {
  if (newRating < 1 || newRating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  this.rating = (this.rating * this.totalRatings + newRating) / (this.totalRatings + 1);
  this.totalRatings += 1;
  return this.save();
};

export default mongoose.model<IQuizTemplate, IQuizTemplateModel>("QuizTemplate", QuizTemplateSchema);
