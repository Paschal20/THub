import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "assistant" | "system";
  text?: string;
  timestamp: Date;
  attachments?: {
    filename: string;
    url: string;
    mimetype?: string;
    size?: number;
  }[];
  meta?: Record<string, any>;
}

export interface IConversation extends Document {
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  messages: IMessage[];
  metadata?: Record<string, any>;
}

const AttachmentSchema = new Schema(
  {
    filename: String,
    url: String,
    mimetype: String,
    size: Number,
  },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    text: { type: String },
    timestamp: { type: Date, default: Date.now },
    attachments: [AttachmentSchema],
    meta: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    title: { type: String },
    messages: { type: [MessageSchema], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>("Conversation", ConversationSchema);
