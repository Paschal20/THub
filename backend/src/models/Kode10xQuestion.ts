import mongoose, { Document } from "mongoose";

export interface IKode10xQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswer: string;
  subject: string;
}

const kode10xQuestionSchema = new mongoose.Schema<IKode10xQuestion>(
  {
    questionText: { type: String, required: true },
    options: {
      type: [{ type: String, required: true }],
      validate: {
        validator: function (val: string[]) {
          return val.length >= 2 && val.length <= 5;
        },
        message: 'Must have between 2 and 5 options'
      }
    },
    correctAnswer: { type: String, required: true },
    subject: { type: String },
  },
  { timestamps: true }
);

export const Kode10xQuestion = mongoose.model<IKode10xQuestion>('Kode10xQuestion', kode10xQuestionSchema);