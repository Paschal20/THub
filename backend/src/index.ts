import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";

import chatRouter from "./routes/chatRoutes";
import uploadRouter from "./routes/upload";
import searchRouter from "./routes/search";
import quizRouter from "./routes/quizRoutes";
import { userRouter } from "./routes/userRouter";
import activityRouter from "./routes/activityRouter";
import { reminderRouter } from "./routes/reminderRouter";
import quizTemplateRouter from "./routes/quizTemplateRoutes";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);
const MONGO_URI =
  process.env.MONGODB_URL || "mongodb://localhost:27017/timely_hub";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/tmp/uploads";

try {
  // Only create directory in local development, not in serverless
  if (require.main === module && !fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (error: any) {
  console.warn("Failed to create upload directory, skipping:", error.message);
  // In serverless environments, directory creation may fail, but we can continue
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || "60", 10),
});
app.use(limiter);

app.use("/uploads", express.static(path.resolve(UPLOAD_DIR)));

app.use("/api/chat", chatRouter);
app.use("/api", uploadRouter);
app.use("/api/search", searchRouter);
app.use("/api/quiz", quizRouter);
app.use("/api", userRouter);
app.use("/api/activities", activityRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/quiz-templates", quizTemplateRouter);

app.get("/", (_req, res) => res.json({ ok: true, version: "1.0.0" }));

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    app.listen(PORT, () => {});
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
