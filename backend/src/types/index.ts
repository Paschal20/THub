export interface User {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

// Reminder Types
export interface Reminder {
  _id: string;
  title: string;
  datetime: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: string;
  notified?: boolean;
}

export interface CreateReminderRequest {
  title: string;
  datetime: string;
}

export interface UpdateReminderRequest {
  title?: string;
  datetime?: string;
}

export interface ReminderResponse extends ApiResponse<Reminder> {}

// Quiz Types
export interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D" | string;
  explanation: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  _id: string;
  topic?: string;
  source: string;
  difficulty: string;
  numQuestions: number;
  questions: QuizQuestion[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuizRequest {
  topic?: string;
  difficulty: string;
  numQuestions: number;
}

export interface QuizResponse extends ApiResponse<Quiz> {}
export interface QuizzesResponse extends ApiResponse<Quiz[]> {}

// Chat Types
export type Role = "user" | "assistant" | "system";

export interface Message {
  role: Role;
  content: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
}

export interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChatRequest {
  title?: string;
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
}

export interface ChatResponse extends ApiResponse<Chat> {}
export interface ChatsResponse extends ApiResponse<Chat[]> {}

export interface SendMessageResponse
  extends ApiResponse<{
    userMessage: Message;
    assistantMessage: Message;
    chatId: string;
    title?: string;
  }> {}

// File Types
export interface File {
  _id: string;
  originalName: string;
  mimeType?: string;
  size?: number;
  url: string;
  secureUrl?: string;
  publicId: string;
  resourceType?: string;
  width?: number;
  height?: number;
  userId: string;
  createdAt: Date;
}

export interface FileResponse extends ApiResponse<File> {}
export interface FilesResponse extends ApiResponse<File[]> {}

// Activity Types
export type ActivityType = "reminder" | "quiz" | "chat" | "file";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  details: any;
  createdAt: string;
}

export interface ActivitiesResponse extends ApiResponse<Activity[]> {}

// Request Types for Controllers
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    _id?: string;
  };
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
