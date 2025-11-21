# Render Environment Setup

Copy these values to the "Environment" tab in your Render dashboard.

## Required Variables
| Key | Value (Example/Description) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGODB_URL` | `mongodb+srv://...` (Your Production MongoDB URI) |
| `JWT_SECRET` | `...` (A strong random string) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret |

## Optional Variables
| Key | Value (Example/Description) |
| :--- | :--- |
| `PORT` | `10000` (Render sets this automatically, but good to know) |
| `JWT_EXPIRES_IN` | `7d` (Default) |
| `CORS_ORIGIN` | `https://your-app-name.onrender.com` (Your Render URL) |
| `UPLOAD_DIR` | `/tmp/uploads` (Render has ephemeral FS, use /tmp or Cloudinary) |
| `MAX_ATTACHMENT_SIZE_BYTES` | `52428800` (50MB Default) |
| `RATE_LIMIT_WINDOW_MS` | `60000` (1 min Default) |
| `RATE_LIMIT_MAX` | `60` (Default) |
| `CLOUDINARY_FOLDER` | `timely-hub` (Default) |
| `EMAIL_USER` | Gmail address (for reminders) |
| `EMAIL_PASS` | Gmail App Password |
| `OPENAI_API_KEY` | `sk-...` (For AI Chat/Quiz) |
| `GEMINI_API_KEY` | `...` (Alternative AI) |
| `FRONTEND_URL` | `https://your-app-name.onrender.com` |
| `MOCK_AI` | `false` (Set `true` to disable OpenAI calls) |
