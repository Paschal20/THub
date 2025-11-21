// types/chat.ts
export type IRole = "user" | "assistant" | "system";

export interface Message {
  role: IRole;
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

export interface ChatState {
  messages: Message[];
  currentChatId: string | null;
  chatHistory: Chat[];
  isLoading: boolean;
  error: string | null;
}
