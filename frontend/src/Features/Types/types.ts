// types/auth.ts
export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  currentPassword?: string;
  school?: {
    _id: string;
    name: string;
  };
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

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface ErrorResponse {
  data: {
    message: string;
  };
  status?: number;
}

export interface Activity {
  id: string;
  type: "reminder" | "quiz" | "chat" | "file";
  title: string;
  description: string;
  createdAt: string;
  // Type-specific fields
  datetime?: string;
  lastSeen?: string;
  topic?: string;
  source?: string;
  difficulty?: string;
  numQuestions?: number;
  messageCount?: number;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
}

export interface Question {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  _id?: string;
}

export interface Quiz {
  _id: string;
  topic: string;
  source: string;
  difficulty: string;
  numQuestions: number;
  questions: Question[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface GenerateQuizRequest {
  topic: string;
  difficulty: string;
  numQuestions: number;
  questionType?: string;
  file?: File;
}

export interface QuizResult {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: Record<number, string | number>;
  timeTaken: number;
  status: "completed" | "paused" | "abandoned";
  completedAt?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
  quizId_populated?: {
    topic: string;
    difficulty: string;
    source: string;
  };
}

export interface SaveQuizResultRequest {
  quizId: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: Record<number, string | number>;
  timeTaken: number;
  status: "completed" | "paused" | "abandoned";
}

export interface QuizResultsResponse {
  message: string;
  data: QuizResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface QuizAnalytics {
  totalQuizzes: number;
  averageScore: number;
  averageTime: number;
  scoreRanges: {
    "0-50": number;
    "50-80": number;
    "80-100": number;
  };
  performanceByDifficulty: {
    easy: { average: number };
    medium: { average: number };
    hard: { average: number };
  };
  performanceByQuestionType: {
    "multiple-choice": { average: number };
    "true-false": { average: number };
    "fill-in-the-blank": { average: number };
  };
  recentResults: {
    date: string;
    score: number;
    totalQuestions: number;
    percentage: number;
  }[];
}

export interface QuizTemplate {
  _id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questionTypes: ("multiple-choice" | "true-false" | "fill-in-the-blank")[];
  tags: string[];
  category: string;
  isPublic: boolean;
  userId: string;
  usageCount: number;
  rating: number;
  totalRatings: number;
  averageRating?: number;
  language: string;
  version: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizTemplateRequest {
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questionTypes: ("multiple-choice" | "true-false" | "fill-in-the-blank")[];
  tags?: string[];
  category: string;
  isPublic?: boolean;
}

export interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface Message {
  _id: string;
  content: string;
  sender: string;
  timestamp: string;
  file?: {
    originalName: string;
    url: string;
    mimeType: string;
  };
}

export interface CreateChatRequest {
  title: string;
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
  file?: File;
}

export interface FileUpload {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  userId: string;
  createdAt: string;
  __v?: number;
}

// CBT Types
export interface CBTQuestion {
  _id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  difficulty: "easy" | "medium" | "hard";
  points: number;
  timeLimit?: number;
  tags: string[];
  hints?: string[];
}

export interface CBTQuiz {
  _id: string;
  title: string;
  topic: string;
  source: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questions: CBTQuestion[];
  userId: string;
  tags: string[];
  category: string;
  isPublic: boolean;
  isTemplate: boolean;
  estimatedTime: number;
  language: string;
  version: number;
  status: "draft" | "published" | "archived";
  metadata: {
    totalAttempts: number;
    averageScore: number;
    averageTime: number;
    successRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CBTQuizSession {
  _id: string;
  userId: string;
  quizId: string;
  sessionToken: string;
  status: "active" | "paused" | "completed" | "expired" | "abandoned";
  currentQuestionIndex: number;
  answers: Map<string, string>;
  timeRemaining: number;
  timeSpent: number;
  startTime: string;
  lastActivity: string;
  expiresAt: string;
  metadata: {
    browserInfo?: string;
    ipAddress?: string;
    deviceInfo?: string;
    totalPauses: number;
    totalResumes: number;
    flaggedQuestions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CBTQuizResult {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: Map<string, string>;
  timeTaken: number;
  status: "in-progress" | "completed" | "paused" | "abandoned";
  completedAt?: string;
  analytics: {
    accuracy: number;
    averageTimePerQuestion: number;
    difficultyBreakdown: {
      easy: { correct: number; total: number };
      medium: { correct: number; total: number };
      hard: { correct: number; total: number };
    };
    questionTypeBreakdown: {
      "multiple-choice": { correct: number; total: number };
      "true-false": { correct: number; total: number };
      "fill-in-the-blank": { correct: number; total: number };
    };
    timeDistribution: Map<string, number>;
    streak: {
      longest: number;
      current: number;
      breakdown: number[];
    };
    confidenceRating?: number;
    areasForImprovement: string[];
  };
  feedback?: {
    rating: number;
    comment?: string;
    difficultyPerception: "too-easy" | "appropriate" | "too-hard";
  };
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCBTQuizRequest {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questionType: "multiple-choice" | "true-false" | "fill-in-the-blank";
  file?: File;
}

export interface CBTQuizResultsResponse {
  results: Array<{
    _id: string;
    quiz: {
      _id: string;
      title: string;
      topic: string;
      difficulty: string;
    };
    score: number;
    totalQuestions: number;
    percentage: number;
    performanceRating: string;
    timeTaken: number;
    completedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CBTQuizSessionResponse {
  session: {
    _id: string;
    status: string;
    timeRemaining: number;
    currentQuestionIndex: number;
    flaggedQuestions: string[];
  };
  quiz: {
    _id: string;
    title: string;
    numQuestions: number;
    questions: Array<{
      _id: string;
      question: string;
      options: string[];
      type: string;
      points: number;
      timeLimit: number;
      hints: string[];
      isFlagged: boolean;
      isAnswered: boolean;
    }>;
  };
}

export interface CBTQuizAnalytics {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  successRate: number;
  difficultyBreakdown: {
    easy: { attempts: number; averageScore: number };
    medium: { attempts: number; averageScore: number };
    hard: { attempts: number; averageScore: number };
  };
  questionTypeBreakdown: {
    "multiple-choice": { attempts: number; averageScore: number };
    "true-false": { attempts: number; averageScore: number };
    "fill-in-the-blank": { attempts: number; averageScore: number };
  };
  performanceOverTime: {
    date: string;
    score: number;
    totalQuestions: number;
    percentage: number;
  }[];
}
