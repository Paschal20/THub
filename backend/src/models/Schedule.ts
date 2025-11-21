import mongoose, { Document } from "mongoose";

export interface ITimeSubjectEntry {
  id: string;
  time: string;
  subject: string;
}

export interface IDaySchedule {
  id: number;
  name: string;
  entries: ITimeSubjectEntry[];
  isExpanded: boolean;
}

export interface ISchedule extends Document {
  userId: mongoose.Types.ObjectId;
  days: IDaySchedule[];
}

export const scheduleSchema = new mongoose.Schema<ISchedule>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "myUsers", required: true },
    days: [
      {
        id: { type: Number, required: true },
        name: { type: String, required: true },
        entries: [
          {
            id: { type: String, required: true },
            time: { type: String, required: true },
            subject: { type: String, required: true },
          },
        ],
        isExpanded: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const ScheduleModel = mongoose.model<ISchedule>("Schedule", scheduleSchema);
