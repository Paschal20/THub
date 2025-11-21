import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message, Chat, ChatState } from "../Types/chat";

const initialState: ChatState = {
  messages: [],
  currentChatId: null,
  chatHistory: [],
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Fetch chat history
    fetchChatsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchChatsSuccess: (state, action: PayloadAction<Chat[]>) => {
      // Filter valid ObjectIds
      const validChats = action.payload.filter(
        (chat) => chat._id && /^[a-f\d]{24}$/i.test(chat._id)
      ); // Valid MongoDB ObjectId
      state.chatHistory = validChats;
      state.isLoading = false;
      // Do not auto-select first chat on mount
    },
    fetchChatsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Fetch single chat
    fetchChatStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchChatSuccess: (state, action: PayloadAction<Chat>) => {
      const chat = action.payload;
      const chatIndex = state.chatHistory.findIndex((c) => c._id === chat._id);
      if (chatIndex >= 0) {
        state.chatHistory[chatIndex] = chat;
      } else {
        state.chatHistory.unshift(chat);
      }
      state.messages = chat.messages;
      state.currentChatId = chat._id;
      state.isLoading = false;
    },
    fetchChatFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Create new chat
    createChatStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createChatSuccess: (state, action: PayloadAction<Chat>) => {
      const chat = action.payload;
      state.chatHistory.unshift(chat);
      state.currentChatId = chat._id;
      state.messages = [];
      state.isLoading = false;
    },
    createChatFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Send message
    sendMessageStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    sendMessageSuccess: (
      state,
      action: PayloadAction<{
        userMessage: Message;
        assistantMessage: Message;
        chatId: string;
        title?: string;
      }>
    ) => {
      const { userMessage, assistantMessage, chatId, title } = action.payload;
      const chat = state.chatHistory.find((c) => c._id === chatId);
      if (chat) {
        chat.messages.push(userMessage, assistantMessage);
        if (title) {
          chat.title = title;
        }
        state.messages = [...chat.messages];
      }
      state.isLoading = false;
    },
    sendMessageFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Load chat
    loadChat: (state, action: PayloadAction<string>) => {
      const chat = state.chatHistory.find((c) => c._id === action.payload);
      if (chat) {
        state.currentChatId = chat._id;
        state.messages = [...chat.messages];
        state.error = null;
      }
    },

    // Update chat title
    updateChatTitle: (
      state,
      action: PayloadAction<{ chatId: string; title: string }>
    ) => {
      const chat = state.chatHistory.find(
        (c) => c._id === action.payload.chatId
      );
      if (chat) {
        chat.title = action.payload.title;
      }
    },

    // Delete chat
    deleteChatSuccess: (state, action: PayloadAction<string>) => {
      state.chatHistory = state.chatHistory.filter(
        (c) => c._id !== action.payload
      );
      if (state.currentChatId === action.payload) {
        state.currentChatId = state.chatHistory[0]?._id || null;
        state.messages = state.chatHistory[0]?.messages || [];
      }
    },

    // Clear all chats
    clearAllChats: (state) => {
      state.chatHistory = [];
      state.currentChatId = null;
      state.messages = [];
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchChatsStart,
  fetchChatsSuccess,
  fetchChatsFailure,
  fetchChatStart,
  fetchChatSuccess,
  fetchChatFailure,
  createChatStart,
  createChatSuccess,
  createChatFailure,
  sendMessageStart,
  sendMessageSuccess,
  sendMessageFailure,
  loadChat,
  updateChatTitle,
  deleteChatSuccess,
  clearAllChats,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
