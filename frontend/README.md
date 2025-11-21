# TimelyHub Frontend

TimelyHub is a productivity web app built with React, TypeScript, and Redux Toolkit. It helps users manage time with reminders, AI chats, quizzes, file uploads, and activity tracking. The frontend connects to a Node.js backend API.

## Quick Start

1. **Clone the repo** and navigate to `Timely-Hub-FE`
2. **Install dependencies**: `npm install`
3. **Start the backend** first (see backend README)
4. **Run the app**: `npm run dev` (uses Vite for fast development)
5. **Open browser**: `http://localhost:5173`

The app uses React Router for navigation and Redux for state management. Authentication is handled with JWT tokens stored in localStorage.

## App Structure & Routes

### Public Routes (No Login Required)
- **`/` (LandingPage)** - Welcome page with app overview and login/signup buttons
- **`/login`** - User login form (email/password)
- **`/signUp`** - User registration form
- **`/forgot-password`** - Password reset request
- **`/reset-password`** - Password reset form (with token)

### Protected Routes (Login Required)
All dashboard routes require authentication. If not logged in, redirects to `/login`.

- **`/dashboard/` (MySchedule)** - Main dashboard showing user's reminders and schedule
- **`/dashboard/chat` (AiChat)** - AI chat interface for conversations with OpenAI
- **`/dashboard/upload` (UploadPage)** - File upload interface (uploads to Cloudinary)
- **`/dashboard/upload-reminder` (SetReminder)** - Create new reminders with date/time picker
- **`/dashboard/quiz` (Quizpage)** - Generate and take AI-powered quizzes
- **`/dashboard/history` (History)** - Unified activity timeline (reminders, chats, quizzes, files)
- **`/dashboard/setting` (Setting)** - User settings and preferences
- **`/dashboard/logout` (Logout)** - Logout confirmation modal

## Features & Page Logic

### 1. **Authentication System**
   - **Logic**: Users register/login to get JWT tokens. Tokens are stored and sent with API requests. Protected routes check for valid tokens. Logout clears tokens and redirects to login.
   - **Components**: Login form, Signup form, ProtectedRoute wrapper, Logout modal

### 2. **Dashboard & Reminders (MySchedule)**
   - **Logic**: Shows user's reminders in a calendar-like view. Reminders are fetched from backend and displayed with status (upcoming/past). Users can mark reminders as seen or delete them. Auto-refreshes every 10 seconds.
   - **Features**: Add new reminders, view schedule, mark as seen, delete reminders

### 3. **AI Chat (AiChat)**
   - **Logic**: Users create chat conversations with an AI assistant. Messages are sent to backend, which calls OpenAI API. Responses are displayed in real-time. Users can create multiple chats and switch between them.
   - **Features**: Create new chats, send messages, view chat history, delete chats

### 4. **File Upload (UploadPage)**
   - **Logic**: Users select files to upload. Files are sent to backend, which uploads to Cloudinary and returns URLs. Uploaded files are listed with download links and metadata (size, type).
   - **Features**: Drag-and-drop upload, file type validation, progress indicators, file listing

### 5. **Reminders (SetReminder)**
   - **Logic**: Form to create new reminders with title and date/time. Uses date picker for easy selection. Reminders are saved to backend and will trigger email notifications when due.
   - **Features**: Title input, date/time picker, validation, save reminder

### 6. **Quiz System (Quizpage)**
   - **Logic**: Users input a topic and difficulty to generate quizzes using AI. Backend creates questions, frontend displays them with multiple choice answers. Tracks user progress and shows results.
   - **Features**: Topic input, difficulty selection, question display, answer selection, score tracking

### 7. **Activity History (History)**
   - **Logic**: Shows a unified timeline of all user activities. Fetches aggregated data from backend (reminders, chats, quizzes, files) and displays in chronological order with icons and colors for each activity type.
   - **Features**: Timeline view, activity type icons, auto-refresh, detailed descriptions

### 8. **Settings (Setting)**
   - **Logic**: User profile management page. Allows updating personal information and preferences. Connects to user update API endpoints.
   - **Features**: Profile editing, preference settings

## State Management (Redux Toolkit)

The app uses Redux Toolkit with RTK Query for API calls:

- **authSlice**: User authentication state (token, user data)
- **chatSlice**: Chat conversations and messages
- **themeSlice**: Dark/light theme preferences
- **authApi**: All API endpoints (users, reminders, chats, quizzes, files, activities)

## UI Components & Styling

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Heroicons (SVG icons)
- **Notifications**: React Hot Toast for alerts
- **Forms**: Custom form components with validation
- **Layout**: PageLayout with sidebar navigation

## Key Components

- **PageLayout**: Main layout with sidebar and content area
- **SideBar**: Navigation menu with links to all dashboard pages
- **RightBar**: Additional info panel (currently shows user info)
- **ProtectedRoute**: Route wrapper that checks authentication
- **AllScreen**: Route container for dashboard pages

## Development

- **Build**: `npm run build` (creates production build in `dist/`)
- **Preview**: `npm run preview` (preview production build)
- **Lint**: `npm run lint`
- **Hot Reload**: Vite provides instant updates during development

## Environment & Dependencies

- **Node.js**: >=16
- **React**: 18.x
- **Redux Toolkit**: State management
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **React Hot Toast**: Notifications
- **Heroicons**: Icons
- **Date-fns**: Date handling

## API Integration

All API calls use RTK Query with automatic caching, loading states, and error handling. Base URL is configured in `utils/api.ts`. Authentication headers are added automatically for protected endpoints.

## Browser Support

Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge).

For issues, check browser console for errors or network tab for API failures.
