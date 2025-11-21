// src/Redux/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Quiz,
  Question,
  CBTQuiz,
  CBTQuizSession,
  CBTQuizResult,
  CBTQuestion,
  GenerateCBTQuizRequest,
  CBTQuizResultsResponse,
  CBTQuizSessionResponse,
} from "../Types/types";

// ✅ Shared base URL for both APIs
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "", // Use env var or empty string for proxy
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

//
// ==================== AUTH API ====================
//
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/loginUser",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: { data: User; token: string; message: string }) => ({
        user: response.data,
        token: response.token,
        message: response.message,
      }),
    }),

    register: builder.mutation<{ message: string }, RegisterRequest>({
      query: (userData) => ({
        url: "/api/signup",
        method: "POST",
        body: userData,
      }),
    }),

    updateUserProfile: builder.mutation<
      { message: string; data: User },
      {
        id: string;
        fullName?: string;
        email?: string;
        password?: string;
        currentPassword?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/update/${id}`,
        method: "PATCH",
        body,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/api/logout",
        method: "POST",
      }),
    }),

    deleteAccount: builder.mutation<
      {
        message: string;
        data: {
          quizzes: { deletedCount: number; message: string };
          chats: { deletedCount: number; message: string };
          files: { deletedCount: number; message: string };
          reminders: { deletedCount: number; message: string };
          schedules: { deleted: boolean; message: string };
        };
      },
      void
    >({
      query: () => ({
        url: "/api/delete-account",
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useUpdateUserProfileMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
} = authApi;

//
// ==================== REMINDER API ====================
//
export interface Reminder {
  _id: string;
  title: string;
  datetime: string;
  createdAt: string;
  lastSeen?: string;
}

export const reminderApi = createApi({
  reducerPath: "reminderApi",
  baseQuery,
  tagTypes: ["Reminders", "Activities"],

  endpoints: (builder) => ({
    // GET /reminders
    getReminders: builder.query<Reminder[], void>({
      query: () => "/api/reminders",
      providesTags: ["Reminders"],
    }),

    // PUT /reminders/:id/seen
    markSeen: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/reminders/${id}/seen`,
        method: "PUT",
      }),
      invalidatesTags: ["Reminders", "Activities"],
    }),

    // DELETE /reminders/:id
    //to check git
    deleteReminder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/reminders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reminders", "Activities"],
    }),

    // POST /reminders
    addReminder: builder.mutation<
      { message: string; reminder: Reminder },
      { title: string; datetime: string }
    >({
      query: (reminder) => ({
        url: "/api/reminders",
        method: "POST",
        body: reminder,
      }),
      invalidatesTags: ["Reminders", "Activities"],
    }),

    // PUT /reminders/:id
    updateReminder: builder.mutation<
      { message: string; reminder: Reminder },
      { id: string; title: string; datetime: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/reminders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Reminders", "Activities"],
    }),

    // POST /reminders/reset
    resetSample: builder.mutation<void, void>({
      query: () => ({
        url: "/api/reminders/reset",
        method: "POST",
      }),
      invalidatesTags: ["Reminders", "Activities"],
    }),
  }),
});

export const {
  useGetRemindersQuery,
  useMarkSeenMutation,
  useDeleteReminderMutation,
  useAddReminderMutation,
  useUpdateReminderMutation,
  useResetSampleMutation,
} = reminderApi;

//
// ==================== ACTIVITY API ====================
//
import type { Activity } from "../Types/types";

export const activityApi = createApi({
  reducerPath: "activityApi",
  baseQuery,
  tagTypes: ["Activities"],
  endpoints: (builder) => ({
    // GET /activities
    getActivities: builder.query<Activity[], void>({
      query: () => "/api/activities",
      providesTags: ["Activities"],
    }),
    // DELETE /activities/:id
    deleteActivity: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/activities/delete-one/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Activities"],
    }),
    // DELETE /activities/clear-all
    clearAllActivities: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/api/activities/clear-all",
        method: "DELETE",
      }),
      invalidatesTags: ["Activities"],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useDeleteActivityMutation,
  useClearAllActivitiesMutation,
} = activityApi;

// ==================== QUIZ API ====================

import type {
  GenerateQuizRequest,
  QuizResult,
  SaveQuizResultRequest,
  QuizResultsResponse,
  QuizAnalytics,
  QuizTemplate,
  CreateQuizTemplateRequest,
} from "../Types/types";

export const quizApi = createApi({
  reducerPath: "quizApi",
  baseQuery,
  tagTypes: ["Quizzes", "QuizResults", "QuizTemplates", "CBTQuizzes", "CBTSessions", "CBTResults"],
  endpoints: (builder) => ({
    generateQuiz: builder.mutation<
      { success: boolean; data: { quizId: string; sessionToken: string; questions: Question[]; metadata: { topic: string; difficulty: string; numQuestions: number }; totalTime: number } },
      GenerateQuizRequest
    >({
      query: ({ file, ...body }) => {
        const formData = new FormData();
        formData.append("topic", body.topic);
        formData.append("difficulty", body.difficulty);
        formData.append("numQuestions", body.numQuestions.toString());
        if (body.questionType)
          formData.append("questionType", body.questionType);
        if (file) formData.append("file", file);
        return {
          url: "/api/quiz",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Quizzes"],
    }),
    getAllQuizzes: builder.query<{ message: string; data: Quiz[] }, void>({
      query: () => "/api/quiz/history",
      providesTags: ["Quizzes"],
    }),
    getQuizById: builder.query<{ message: string; data: Quiz }, string>({
      query: (id) => `/api/quiz/${id}`,
    }),
    saveQuizResult: builder.mutation<
      { message: string; data: QuizResult },
      SaveQuizResultRequest
    >({
      query: (body) => ({
        url: "/api/quiz/result",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QuizResults"],
    }),
    getQuizResults: builder.query<
      QuizResultsResponse,
      { page?: number; limit?: number; status?: string; quizId?: string }
    >({
      query: (params) => ({
        url: "/api/quiz/results",
        method: "GET",
        params,
      }),
      providesTags: ["QuizResults"],
    }),
    getQuizAnalytics: builder.query<
      { message: string; data: QuizAnalytics },
      void
    >({
      query: () => "/api/quiz/analytics",
      providesTags: ["QuizResults"],
    }),
    deleteQuizResult: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/quiz/results/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuizResults"],
    }),
    startQuizSession: builder.mutation<
      { success: boolean; data: { sessionToken: string; quiz: Quiz } },
      { quizId: string }
    >({
      query: (body) => ({
        url: "/api/quiz/sessions",
        method: "POST",
        body,
      }),
    }),
    getQuizSession: builder.query<
      { success: boolean; data: { quiz: Quiz; currentQuestion: number; answers: Record<number, string> } },
      string
    >({
      query: (sessionToken) => `/api/quiz/sessions/${sessionToken}`,
    }),
    updateQuizSession: builder.mutation<
      { success: boolean; data: { sessionToken: string; answers: Record<number, string> } },
      { sessionToken: string; updates: { answers: Record<number, string>; currentQuestionIndex?: number; lastActivityAt?: Date } }
    >({
      query: ({ sessionToken, updates }) => ({
        url: `/api/quiz/sessions/${sessionToken}`,
        method: "PUT",
        body: updates,
      }),
    }),
    completeQuizSession: builder.mutation<
      { success: boolean; data: { score: number; totalQuestions: number; completedAt: string } },
      { sessionToken: string; finalAnswers: Record<number, string | number>; score: number }
    >({
      query: ({ sessionToken, ...body }) => ({
        url: `/api/quiz/sessions/${sessionToken}/complete`,
        method: "POST",
        body,
      }),
    }),

    // Quiz Template endpoints
    createQuizTemplate: builder.mutation<
      { success: boolean; data: QuizTemplate },
      CreateQuizTemplateRequest
    >({
      query: (body) => ({
        url: "/api/quiz-templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["QuizTemplates"],
    }),

    getUserQuizTemplates: builder.query<
      { success: boolean; data: QuizTemplate[] },
      { status?: string; isPublic?: boolean }
    >({
      query: (params) => ({
        url: "/api/quiz-templates/my",
        method: "GET",
        params,
      }),
      providesTags: ["QuizTemplates"],
    }),

    getPublicQuizTemplates: builder.query<
      {
        success: boolean;
        data: QuizTemplate[];
        pagination: { page: number; limit: number; total: number; pages: number };
      },
      {
        category?: string;
        difficulty?: string;
        tags?: string[];
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/api/quiz-templates/public",
        method: "GET",
        params,
      }),
      providesTags: ["QuizTemplates"],
    }),

    getPopularQuizTemplates: builder.query<
      { success: boolean; data: QuizTemplate[] },
      { category?: string; difficulty?: string; limit?: number }
    >({
      query: (params) => ({
        url: "/api/quiz-templates/popular",
        method: "GET",
        params,
      }),
      providesTags: ["QuizTemplates"],
    }),

    getQuizTemplateById: builder.query<
      { success: boolean; data: QuizTemplate },
      string
    >({
      query: (id) => `/api/quiz-templates/${id}`,
      providesTags: ["QuizTemplates"],
    }),

    updateQuizTemplate: builder.mutation<
      { success: boolean; data: QuizTemplate },
      { id: string; updates: Partial<CreateQuizTemplateRequest> }
    >({
      query: ({ id, updates }) => ({
        url: `/api/quiz-templates/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["QuizTemplates"],
    }),

    deleteQuizTemplate: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/api/quiz-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuizTemplates"],
    }),

    rateQuizTemplate: builder.mutation<
      { success: boolean; data: { averageRating: number; totalRatings: number } },
      { id: string; rating: number }
    >({
      query: ({ id, rating }) => ({
        url: `/api/quiz-templates/${id}/rate`,
        method: "POST",
        body: { rating },
      }),
      invalidatesTags: ["QuizTemplates"],
    }),

    useQuizTemplate: builder.mutation<
      { success: boolean; data: QuizTemplate },
      string
    >({
      query: (id) => ({
        url: `/api/quiz-templates/${id}/use`,
        method: "POST",
      }),
      invalidatesTags: ["QuizTemplates"],
    }),

    // CBT Quiz endpoints
    generateCBTQuiz: builder.mutation<
      { success: boolean; data: CBTQuiz },
      GenerateCBTQuizRequest
    >({
      query: ({ file, ...body }) => {
        const formData = new FormData();
        formData.append("topic", body.topic);
        formData.append("difficulty", body.difficulty);
        formData.append("numQuestions", body.numQuestions.toString());
        formData.append("questionType", body.questionType);
        if (file) formData.append("file", file);
        return {
          url: "/api/cbt/generate",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["CBTQuizzes"],
    }),
    getCBTQuizzes: builder.query<{ message: string; data: CBTQuiz[] }, void>({
      query: () => "/api/cbt/quizzes",
      providesTags: ["CBTQuizzes"],
    }),
    getCBTQuizById: builder.query<{ message: string; data: CBTQuiz }, string>({
      query: (id) => `/api/cbt/quizzes/${id}`,
    }),
    startCBTSession: builder.mutation<
      { success: boolean; data: CBTQuizSession },
      { quizId: string }
    >({
      query: (body) => ({
        url: `/api/cbt/quizzes/${body.quizId}/start`,
        method: "POST",
      }),
      invalidatesTags: ["CBTSessions"],
    }),
    getCBTSession: builder.query<
      { success: boolean; data: CBTQuizSessionResponse },
      string
    >({
      query: (sessionToken) => `/api/cbt/session/${sessionToken}`,
      providesTags: ["CBTSessions"],
    }),
    submitCBTAnswer: builder.mutation<
      { success: boolean; message: string },
      { sessionToken: string; questionId: string; answer: string }
    >({
      query: ({ sessionToken, ...body }) => ({
        url: `/api/cbt/session/${sessionToken}/answer`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CBTSessions"],
    }),
    flagCBTQuestion: builder.mutation<
      { success: boolean; message: string },
      { sessionToken: string; questionId: string }
    >({
      query: ({ sessionToken, ...body }) => ({
        url: `/api/cbt/session/${sessionToken}/flag`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["CBTSessions"],
    }),
    pauseCBTSession: builder.mutation<
      { success: boolean; message: string },
      { sessionToken: string }
    >({
      query: (sessionToken) => ({
        url: `/api/cbt/session/${sessionToken}/pause`,
        method: "POST",
      }),
      invalidatesTags: ["CBTSessions"],
    }),
    resumeCBTSession: builder.mutation<
      { success: boolean; message: string },
      { sessionToken: string }
    >({
      query: (sessionToken) => ({
        url: `/api/cbt/session/${sessionToken}/resume`,
        method: "POST",
      }),
      invalidatesTags: ["CBTSessions"],
    }),
    submitCBTQuiz: builder.mutation<
      { success: boolean; data: CBTQuizResult },
      { sessionToken: string }
    >({
      query: (sessionToken) => ({
        url: `/api/cbt/session/${sessionToken}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["CBTResults", "CBTSessions"],
    }),
    getCBTResults: builder.query<
      { success: boolean; data: CBTQuizResultsResponse },
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/api/cbt/results",
        params,
      }),
      providesTags: ["CBTResults"],
    }),
    getCBTResultById: builder.query<
      { success: boolean; data: CBTQuizResult },
      string
    >({
      query: (id) => `/api/cbt/results/${id}`,
    }),

    // Additional CBT endpoints for Kode10x integration
    getCBTQuestions: builder.query<
      { selectedQuestions: CBTQuestion[] },
      { subject: string; count?: number }
    >({
      query: ({ subject, count = 10 }) => `/api/kode10x/getRandomQuestions/${subject}?count=${count}`,
    }),

    submitCBTQuizKode10x: builder.mutation<
      { message: string; data: any },
      {
        userId: string;
        answers: Array<{ questionId: string; userAnswer: string }>;
        presentedQuestions: string[];
        subject: string;
      }
    >({
      query: (body) => ({
        url: "/api/kode10x/submitQuiz",
        method: "POST",
        body,
      }),
    }),

    getCBTUserResults: builder.query<
      { data: any },
      string
    >({
      query: (userId) => `/api/kode10x/results/${userId}`,
    }),

    getCBTUserHistory: builder.query<
      { data: any },
      { userId: string; subject?: string }
    >({
      query: ({ userId, subject }) => {
        const url = `/api/kode10x/history/${userId}`;
        return subject ? `${url}?subject=${subject}` : url;
      },
    }),

    getCBTGlobalLeaderboard: builder.query<
      { leaderboard: any[] },
      { limit?: number }
    >({
      query: ({ limit = 20 }) => `/api/leaderboard/global?limit=${limit}`,
    }),

    getCBTSchoolLeaderboard: builder.query<
      { leaderboard: any[] },
      { schoolId: string; limit?: number }
    >({
      query: ({ schoolId, limit = 10 }) => `/api/leaderboard/school/${schoolId}?limit=${limit}`,
    }),

    getCBTSchoolsLeaderboard: builder.query<
      { rankings: any[] },
      { limit?: number }
    >({
      query: ({ limit = 10 }) => `/api/leaderboard/schools?limit=${limit}`,
    }),

    getCBTQuizProgress: builder.query<
      { data: any } | null,
      { userId: string; subject: string }
    >({
      query: ({ userId, subject }) => `/api/kode10x/progress/${userId}?subject=${subject}`,
    }),

    saveUserPreferences: builder.mutation<
      { message: string; success: boolean },
      { userId: string; preferences: Record<string, any> }
    >({
      query: ({ userId, ...body }) => ({
        url: `/api/users/${userId}/preferences`,
        method: "POST",
        body,
      }),
    }),

    getUserPreferences: builder.query<
      { data: Record<string, any> } | null,
      string
    >({
      query: (userId) => `/api/users/${userId}/preferences`,
    }),

    saveCBTQuizProgress: builder.mutation<
      { message: string; success: boolean },
      {
        userId: string;
        subject: string;
        currentQuestionIndex: number;
        answers: Record<string, string>;
        timeLeft: number;
        questions: any[];
      }
    >({
      query: (body) => ({
        url: "/api/kode10x/saveProgress",
        method: "POST",
        body,
      }),
    }),

    getCBTUserRanking: builder.query<
      any,
      string
    >({
      query: (userId) => `/api/leaderboard/user/${userId}`,
    }),
  }),
});

export const {
  useGenerateQuizMutation,
  useGetAllQuizzesQuery,
  useGetQuizByIdQuery,
  useLazyGetQuizByIdQuery,
  useSaveQuizResultMutation,
  useGetQuizResultsQuery,
  useGetQuizAnalyticsQuery,
  useDeleteQuizResultMutation,
  useStartQuizSessionMutation,
  useGetQuizSessionQuery,
  useUpdateQuizSessionMutation,
  useCompleteQuizSessionMutation,
  useCreateQuizTemplateMutation,
  useGetUserQuizTemplatesQuery,
  useGetPublicQuizTemplatesQuery,
  useGetPopularQuizTemplatesQuery,
  useGetQuizTemplateByIdQuery,
  useUpdateQuizTemplateMutation,
  useDeleteQuizTemplateMutation,
  useRateQuizTemplateMutation,
  useUseQuizTemplateMutation,
  // CBT hooks
  useGenerateCBTQuizMutation,
  useGetCBTQuizzesQuery,
  useGetCBTQuizByIdQuery,
  useStartCBTSessionMutation,
  useGetCBTSessionQuery,
  useSubmitCBTAnswerMutation,
  useFlagCBTQuestionMutation,
  usePauseCBTSessionMutation,
  useResumeCBTSessionMutation,
  useSubmitCBTQuizMutation,
  useGetCBTResultsQuery,
  useGetCBTResultByIdQuery,
  useGetCBTQuestionsQuery,
  useSubmitCBTQuizKode10xMutation,
  useGetCBTUserResultsQuery,
  useGetCBTUserHistoryQuery,
  useGetCBTGlobalLeaderboardQuery,
  useGetCBTSchoolLeaderboardQuery,
  useGetCBTSchoolsLeaderboardQuery,
  useGetCBTUserRankingQuery,
  useGetUserPreferencesQuery,
  useSaveUserPreferencesMutation,
  useGetCBTQuizProgressQuery,
  useSaveCBTQuizProgressMutation,
} = quizApi;

// ==================== CHAT API ====================

import type {
  Chat,
  CreateChatRequest,
  SendMessageRequest,
} from "../Types/types";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery,
  tagTypes: ["Chats"],
  endpoints: (builder) => ({
    createChat: builder.mutation<Chat, CreateChatRequest>({
      query: (body) => ({
        url: "/api/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chats"],
    }),
    sendMessage: builder.mutation<{ message: string }, SendMessageRequest>({
      query: ({ chatId, file, ...body }) => {
        const formData = new FormData();
        formData.append("message", body.message);
        formData.append("chatId", chatId);
        if (file) formData.append("file", file);
        return {
          url: "/api/chat/message",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Chats"],
    }),
    getChats: builder.query<Chat[], void>({
      query: () => "/api/chat",
      providesTags: ["Chats"],
    }),
    getChat: builder.query<Chat, string>({
      query: (id) => `/api/chat/${id}`,
    }),
    deleteChat: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/chat/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chats"],
    }),
  }),
});

export const {
  useCreateChatMutation,
  useSendMessageMutation,
  useGetChatsQuery,
  useGetChatQuery,
  useDeleteChatMutation,
} = chatApi;

// ==================== UPLOAD API ====================

import type { FileUpload } from "../Types/types";

export const uploadApi = createApi({
  reducerPath: "uploadApi",
  baseQuery,
  tagTypes: ["Files"],
  endpoints: (builder) => ({
    uploadFiles: builder.mutation<
      { message: string; data: FileUpload[] },
      { files: File[] }
    >({
      query: ({ files }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        return {
          url: "/api/upload",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Files"],
    }),
    getFiles: builder.query<{ message: string; data: FileUpload[] }, void>({
      query: () => "/api/files",
      providesTags: ["Files"],
    }),
    deleteFile: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/api/files/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Files"],
    }),
  }),
});

export const {
  useUploadFilesMutation,
  useGetFilesQuery,
  useDeleteFileMutation,
} = uploadApi;
