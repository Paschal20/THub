# TimelyHub - AI Context File
> DO NOT DELETE. This file guides all AI Agents working on this repo.

## 1. Project Identity
- **Goal:** A productivity application helping users manage time via reminders, AI chats, quizzes, file uploads, and activity tracking.
- **Stack:**
  - **Frontend:** React (Vite), Redux Toolkit, Tailwind CSS.
  - **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose).
  - **AI:** OpenAI API.
  - **Services:** Cloudinary (Storage), Nodemailer (Email).
- **Architecture:** Client-Server Monorepo. 
  - `frontend/`: Single Page Application (SPA) built with Vite.
  - `backend/`: REST API server at `/api` handling auth, data, and AI logic.

## 2. Current State (Dynamic)
- **Status:** Development
- **Last Major Change:** Initial Agent Scan & Setup.

## 3. Feature Roadmap
- [ ] Remove extra AI services (Ref: `backend/TODO_Remove_Extra_AI_Services.md`)
- [ ] Secure `getAll` users endpoint (currently public/admin-only but open)
- [ ] Implement production-grade authentication guards
- [ ] Review `backend/CBT_MIGRATION_README.md` for migration tasks

## 4. Agent Protocol
- **Linting Rules:** Strict (ESLint configured in both `frontend` and `backend`).
- **Testing:**
  - Backend: `npm test` or `./test_all_paths.sh`
  - Frontend: `npm run lint`
- **Tool Usage:**
  - Use `gemini` for logic/planning.
  - Use `opencode` for bulk refactoring.
