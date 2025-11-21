import mongoose, { Document } from "mongoose";

export interface ISchool extends Document {
  name: string;
  normalizedName: string;
  studentCount: number;
}

const schoolSchema = new mongoose.Schema<ISchool>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true
    },
    studentCount: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

// Normalize before saving to prevent duplicates
schoolSchema.pre('save', function (next) {
  this.normalizedName = this.name.toLowerCase().trim().replace(/\s+/g, ' ');
  next();
});

export const School = mongoose.model<ISchool>("School", schoolSchema);