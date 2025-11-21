import express, { Express, Request, Response, NextFunction } from "express";
import config from "./config/env";
import { connectDB, ensureDBConnection } from "./config/Database";
import { generateToken } from "./config/jwt";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { mkdirSync, existsSync } from "fs";

// Import routes
import { userRouter } from "./routes/userRouter";
import { authLimiter } from "./middleware/rateLimiter";
import chatRoutes from "./routes/chatRoutes";
import quizRoutes from "./routes/quizRoutes";
import quizTemplateRoutes from "./routes/quizTemplateRoutes";
import cbtRoutes from "./routes/cbtRoutes";
import kode10xQuizRoutes from "./routes/kode10xQuizRoutes";
import schoolRoutes from "./routes/schoolRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";
import databaseRoutes from "./routes/databaseRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { reminderRouter } from "./routes/reminderRouter";
import activityRouter from "./routes/activityRouter";
import diagnosticRoutes from "./routes/diagnosticRoutes";
import { monitorQueries, databaseHealthCheck, addOptimizationHeaders } from "./middleware/databaseOptimization";

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    callback(new Error(`Origin '${origin}' not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Scheduler service for scheduled tasks
let schedulerService: any = null;
if (require.main === module) {
  try {
    schedulerService = require("./services/schedulerService").schedulerService;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Scheduler service not available:', errorMessage);
  }
}

// Create Express application
const app: Express = express();

// Trust first proxy (Vercel, Heroku, etc.)
app.set("trust proxy", 1);

// Enable CORS
app.use(cors(corsOptions));

// Request logging
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
if (!existsSync(config.uploadDir)) {
  mkdirSync(config.uploadDir, { recursive: true });
}

// Serve static files
app.use("/uploads", express.static(config.uploadDir));

// Apply database middleware
app.use(monitorQueries);
app.use(addOptimizationHeaders);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database health check
app.get("/health/db", databaseHealthCheck);

// API routes
app.use("/api/users", userRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quiz-templates", quizTemplateRoutes);
app.use("/api/cbt", cbtRoutes);
app.use("/api/kode10x", kode10xQuizRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reminders", reminderRouter);
app.use("/api/activities", activityRouter);
app.use("/api/diagnostic", diagnosticRoutes);

// Database connection (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch(console.error);
}

// Ensure database connection for API routes
app.use('/api', async (req, res, next) => {
  try {
    await ensureDBConnection();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      message: 'Service temporarily unavailable',
      error: 'Database connection failed'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(config.nodeEnv === 'development' && { 
      error: err.message, 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    })
  });
});

// Start the server if this file is run directly
if (require.main === module) {
  const PORT = config.port;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
    console.log(`🌐 Allowed CORS origins: ${config.corsOrigins.join(', ')}`);
    
    // Generate a test token in development
    if (config.nodeEnv === 'development') {
      const testToken = generateToken('test-user-id', 'user');
      console.log('🔑 Test JWT token (use in Authorization: Bearer <token>):');
      console.log(testToken);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}

export default app;
