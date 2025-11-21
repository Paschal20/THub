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
import { corsMiddleware } from "./middleware/corsMiddleware";

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
app.use(corsMiddleware);

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

// Ensure upload directory exists (only for local/non-serverless environments)
// Vercel serverless functions have read-only filesystem except /tmp
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    if (!existsSync(config.uploadDir)) {
      mkdirSync(config.uploadDir, { recursive: true });
    }
    // Serve static files (only for local development)
    app.use("/uploads", express.static(config.uploadDir));
  } catch (error) {
    console.warn('Could not create upload directory:', error);
  }
}

// Apply database middleware
app.use(monitorQueries);
app.use(addOptimizationHeaders);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database health check
app.get("/health/db", databaseHealthCheck);

// API routes
app.use("/api/users", userRouter);

// Database connection (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB().catch(console.error);
}

// Ensure database connection for API routes with retry logic
app.use('/api', async (req, res, next) => {
  const maxRetries = 2;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await ensureDBConnection();
      return next(); // Success - proceed to route
    } catch (error) {
      lastError = error as Error;
      console.error(`Database connection attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait briefly before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }
  
  // All retries failed
  console.error('All database connection attempts failed');
  res.status(503).json({
    message: 'Service temporarily unavailable',
    error: 'Database connection failed'
  });
});

// Mount routes
app.use("/api", userRouter);
app.get("/api/question/getRandomQuestions", (req, res) => {
  console.log("getRandomQuestions called");
  const questions = [
    { _id: "q1", questionText: "What is 2 + 2?", options: ["3", "4", "5", "6"], correctAnswer: "4" },
    { _id: "q2", questionText: "Capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correctAnswer: "Paris" },
    { _id: "q3", questionText: "Color of sky?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Blue" },
    { _id: "q4", questionText: "Largest planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], correctAnswer: "Jupiter" },
    { _id: "q5", questionText: "Water formula?", options: ["H2O", "CO2", "O2", "H2"], correctAnswer: "H2O" }
  ];
  res.json({ success: true, selectedQuestions: questions });
});
app.post("/api/question/submitQuiz", (req, res) => {
  console.log("submitQuiz called", req.body);
  res.json({ success: true, message: "Quiz submitted", results: { totalQuestions: 5, correctAnswers: 3, score: 3, percentage: 60, details: [] } });
});
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quiz-templates", quizTemplateRoutes);
app.use("/api/cbt", cbtRoutes);
app.use("/api/kode10x", kode10xQuizRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api", uploadRoutes);
app.use("/api/reminders", reminderRouter);
app.use("/api/diagnostics", diagnosticRoutes);
app.use("/api/activities", activityRouter);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Root route for development
  app.get("/", (req, res) => {
    res.json({
      message: "Timely Hub Backend",
      api: "/api",
      timestamp: new Date().toISOString(),
    });
  });
}

// 404 handler (only for API routes if in production, or all routes in dev)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  } else if (process.env.NODE_ENV !== 'production') {
     res.status(404).json({
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if ('name' in err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        errors: 'errors' in err ? (err as any).errors : {},
        timestamp: new Date().toISOString()
      });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Default error response
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { 
      stack: 'stack' in err ? (err as any).stack : undefined
    }),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

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

// Export the app for Vercel serverless functions
export default app;
