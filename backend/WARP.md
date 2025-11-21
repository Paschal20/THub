# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

TimelyHub Backend is a productivity application API built with Node.js, Express, TypeScript, and MongoDB. It provides user management, AI-powered chat, quiz generation, file uploads, reminders with email notifications, and activity tracking.

## Development Commands

### Setup & Running
- `npm install` - Install all dependencies
- `npm run dev` - Run development server with auto-restart (TypeScript compilation + nodemon)
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm start` - Build and run production server
- `npm run vercel-build` - Build for Vercel deployment

### Testing
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `./test_all_paths.sh` - Bash script to test all API endpoints (creates test user, requires curl)

### Database
- `npm run migrate-cbt` - Migrate CBT/Kode10x users to main TimelyHub database

### Development Notes
- Server runs on `http://localhost:5040` by default
- Uses nodemon for auto-restart during development
- TypeScript is compiled before running with ts-node
- Test token is auto-generated in development mode on server start

## Architecture Overview

### Core Structure

**Layered Architecture:**
- **Routes** (`src/routes/`) - Define API endpoints and route requests
- **Controllers** (`src/controllers/`) - Handle business logic for each route
- **Services** (`src/services/`) - Reusable business logic (AI, notifications, scheduling, search)
- **Models** (`src/models/`) - Mongoose schemas defining database structure
- **Middleware** (`src/middleware/`) - Auth, validation, rate limiting, error handling, database optimization
- **Utils** (`src/utils/`) - Helper functions (Cloudinary, email, password reset, string matching)
- **Config** (`src/config/`) - Environment configuration, database connection, JWT, security settings

### Key Architectural Patterns

**Database Connection:**
- Connection pooling with retry logic for serverless environments (Vercel)
- `connectDB()` establishes initial connection
- `ensureDBConnection()` checks/reconnects per request (critical for serverless)
- Connection tracking with `isConnected` flag to avoid redundant connections

**Authentication Flow:**
- JWT-based authentication with Argon2 password hashing
- `protect` middleware validates tokens and attaches `user` to request
- Token format: `Authorization: Bearer <token>`
- Tokens include user ID and role, expire based on `JWT_EXPIRES_IN` env var

**Serverless Optimization:**
- Code checks for `process.env.VERCEL` to adapt behavior
- File system operations avoid write outside `/tmp` in production
- Upload directory creation skipped on Vercel
- Database reconnection logic for cold starts

**Scheduled Tasks:**
- `schedulerService` runs cron jobs for:
  - Reminder notifications (every minute)
  - Database maintenance (daily at 2 AM)
  - Cache cleanup monitoring (every 30 minutes)
- Scheduler only starts when `require.main === module` (not in Vercel)

**Database Optimization:**
- Comprehensive indexing strategy for Quiz, QuizResult, QuizTemplate models
- TTL-based in-memory caching (user analytics: 10min, global analytics: 15min)
- Query monitoring middleware logs slow queries (>100ms)
- Aggregation pipelines optimized for analytics endpoints
- Database health monitoring available at `/health/db` and `/api/database/*`

### Important Modules

**AI Services:**
- OpenAI integration for chat and quiz generation
- AI services located in `src/services/aiServices.ts` and `src/utils/aiService.ts`
- Content processing for quiz generation from files/documents
- CBT-specific AI services in `src/services/CBTQuizGenerationService.ts`

**File Uploads:**
- Cloudinary for cloud storage (production)
- Multer for local file handling (development)
- Upload routes handle multipart/form-data
- File metadata stored in MongoDB with Cloudinary URLs

**Reminders & Notifications:**
- Email notifications via Nodemailer (Gmail SMTP)
- Scheduler checks for due reminders every minute (5-minute lookahead)
- Reminders marked as `notified` after sending to prevent duplicates
- Email configuration in `src/services/notificationService.ts`

**Quiz System:**
- Multiple quiz types: regular quizzes, quiz templates, CBT quizzes, Kode10x quizzes
- AI-powered question generation from topics or file content
- String matching for answer validation (exact, fuzzy, normalized)
- Quiz sessions track in-progress attempts
- Analytics service for performance metrics and leaderboards

### Database Models

**Core Models:**
- `User` - Authentication, profile data, role-based access
- `Chat` - AI chat sessions with message history
- `Quiz/QuizTemplate` - Quiz definitions and reusable templates
- `QuizResult/QuizSession` - Quiz attempts and scoring
- `CBTQuiz/CBTQuizResult/CBTQuizSession` - Computer-based testing system
- `Kode10xQuestion/Kode10xQuizAttempt` - Coding quiz platform
- `File` - Uploaded file metadata (Cloudinary URLs)
- `Reminder` - Scheduled reminders with notification tracking
- `School` - School affiliations for users
- `Schedule` - User schedules and time management

### Middleware Stack

**Request Flow:**
1. CORS validation (Vercel deployments + configured origins)
2. Rate limiting (configurable per environment)
3. Body parsing (10MB limit for JSON/form data)
4. Database connection check (`ensureDBConnection` for `/api` routes)
5. Request logging (Morgan in dev mode)
6. Database query monitoring (tracks slow queries)
7. Route-specific middleware (auth, validation, file upload)
8. Controller logic
9. Optimization headers added
10. Error handling middleware

**Authentication:**
- `protect` middleware for authenticated routes
- `authorize([roles])` for role-based access control
- Token extracted from `Authorization: Bearer <token>` header
- User attached to `req.user` after validation

**Validation:**
- Joi schemas for request validation
- Custom validation middleware in `src/middleware/validation.ts`
- Error responses standardized as `{ message: string, error?: string }`

### Environment Configuration

**Required Variables:**
- `MONGODB_URL` - MongoDB connection string (required)
- `JWT_SECRET` - Secret key for JWT signing (required)

**Optional but Recommended:**
- `PORT` - Server port (default: 5040)
- `NODE_ENV` - Environment mode (development/production/test)
- `CORS_ORIGIN` - Comma-separated allowed origins
- `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` - File uploads
- `OPENAI_API_KEY` - AI chat and quiz generation
- `EMAIL_USER/EMAIL_PASS` - Email notifications
- `FRONTEND_URL` - Frontend application URL

**Development vs Production:**
- Development: verbose logging, test token generation, local file uploads
- Production: optimized logging, Cloudinary uploads, serverless adaptations
- Vercel: automatic env var injection, no .env file needed

### API Design Patterns

**Response Format:**
- Success: `{ message: string, data?: any }`
- Error: `{ message: string, error?: string }` with appropriate status code
- Timestamps included in responses where relevant

**Error Handling:**
- Validation errors: 400
- Authentication errors: 401
- Not found: 404
- Server errors: 500 (stack trace in development only)
- Database errors: 503 for connection failures

**Pagination & Filtering:**
- Analytics endpoints support date range filtering
- Quiz/template listings support difficulty, category, tag filtering
- Text search enabled on indexed fields (title, topic, description)

### Special Features

**Database Monitoring:**
- Real-time query performance tracking
- Slow query detection and logging
- Cache statistics and management
- Automated maintenance tasks
- Endpoints under `/api/database/*` for monitoring

**Migration Support:**
- CBT/Kode10x user migration script (`npm run migrate-cbt`)
- Handles duplicate detection and conflict resolution
- Migrates schools, users, questions, and quiz attempts
- See `CBT_MIGRATION_README.md` for details

**String Matching for Quizzes:**
- Multiple matching strategies: exact, normalized, fuzzy
- Case-insensitive and whitespace-tolerant
- Custom logic in `src/utils/stringMatching.ts` and `src/utils/CBTStringMatching.ts`
- Unit tests in `src/tests/unit/stringMatching.test.ts`

## Development Workflow

### Making Changes

**Adding New Routes:**
1. Create route file in `src/routes/`
2. Create controller in `src/controllers/`
3. Add validation middleware if needed
4. Mount route in `src/server.ts`
5. Update this WARP.md if it's a major feature

**Adding Models:**
1. Create Mongoose schema in `src/models/`
2. Add indexes for common queries (see `DATABASE_OPTIMIZATIONS.md`)
3. Export model for use in controllers
4. Consider adding to analytics service if user-facing

**Environment Changes:**
1. Update `src/config/env.ts` with new config interface
2. Add parsing/validation logic
3. Update `.env.example`
4. Document in README.md

### Testing Approach

**Unit Tests:**
- Jest with ts-jest for TypeScript
- Tests located in `src/tests/unit/`
- Run with `npm test` or `npm run test:watch`

**Integration Tests:**
- Bash script `test_all_paths.sh` for endpoint testing
- Creates test user and tests all routes sequentially
- Requires bash shell and curl

**Manual Testing:**
- Use test JWT token printed on dev server start
- Postman/Insomnia for API testing
- Health check at `/health` for server status

### Code Style & Conventions

**TypeScript:**
- Strict mode enabled
- Exact optional property types
- No unchecked indexed access
- Source maps for debugging

**Async/Await:**
- Prefer async/await over promises
- Always use try-catch for error handling
- Return early from error conditions

**Error Handling:**
- Never throw unhandled errors
- Log errors with `console.error`
- Return structured error responses
- Use error handling middleware for uncaught errors

**Database Queries:**
- Use indexes for filter fields
- Limit result sets where possible
- Use lean() for read-only queries
- Consider caching for expensive operations

### Common Pitfalls

**Serverless Environment:**
- Don't rely on in-memory state persisting between requests
- File system is read-only except `/tmp`
- Connection pooling may not work as expected
- Cold starts can cause timeout issues

**Authentication:**
- Always use `protect` middleware for private routes
- Don't forget to send token in Authorization header
- Tokens expire based on `JWT_EXPIRES_IN`
- Password updates require current password verification

**Database Connection:**
- Always await `ensureDBConnection()` in serverless environments
- Don't assume connection persists between requests
- Handle connection errors gracefully with 503 responses

**File Uploads:**
- Check Cloudinary config before processing uploads
- Enforce file size limits (default 10MB)
- Clean up temp files after upload
- Store file metadata in database for reference

## Deployment

**Vercel Configuration:**
- `vercel.json` routes all requests to `src/server.ts`
- Build command: `npm run vercel-build`
- Max function duration: 30 seconds
- Environment variables configured in Vercel dashboard

**Production Checklist:**
- Set `NODE_ENV=production`
- Configure all required environment variables
- Set up Cloudinary for file storage
- Configure email credentials for notifications
- Set secure `JWT_SECRET`
- Whitelist frontend origin in `CORS_ORIGIN`
- Monitor database performance via `/api/database/*` endpoints

**Monitoring:**
- Database health: `/health/db`
- Application health: `/health`
- Database statistics: `/api/database/stats` (requires auth)
- Slow queries: `/api/database/slow-queries` (requires auth)
