import React, { useState, useRef, useEffect } from "react";
import {
  FaPaperPlane,
  FaChevronLeft,
  FaChevronRight,
  FaSpinner,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store";
import Button from "../../../Components/Button";
import {
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
  deleteChatSuccess,
  clearError,
} from "../../../Features/ChatSlice/ChatSlice";

const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // Use env var or empty string for proxy

const AiChat: React.FC = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const token = auth.token;
  const dispatch = useDispatch();
  const {
    messages = [],
    chatHistory = [],
    currentChatId,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.chat);

  const [input, setInput] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch chat history on component mount
  // Updated API endpoint to /api/chat to match backend routes
  useEffect(() => {
    if (!token) return;

    const fetchChats = async () => {
      dispatch(fetchChatsStart());
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        dispatch(fetchChatsSuccess(data));
      } catch {
        dispatch(fetchChatsFailure("Failed to fetch chat history"));
      }
    };

    fetchChats();
  }, [token, dispatch]);

  // Fetch current chat messages when chat changes
  useEffect(() => {
    if (!token || !currentChatId || !/^[a-f\d]{24}$/i.test(currentChatId))
      return;

    const fetchChat = async () => {
      dispatch(fetchChatStart());
      try {
        const res = await fetch(`${API_BASE}/api/chat/${currentChatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        dispatch(fetchChatSuccess(data));
      } catch {
        dispatch(fetchChatFailure("Failed to fetch chat"));
      }
    };

    fetchChat();
  }, [token, currentChatId, dispatch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = async () => {
    if (!token) return;

    dispatch(createChatStart());
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      dispatch(createChatSuccess(data));
    } catch {
      dispatch(createChatFailure("Failed to create new chat"));
    }
  };

  const handleLoadChat = (id: string) => {
    dispatch(loadChat(id));
    setIsHistoryOpen(false);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering loadChat
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/chat/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        dispatch(deleteChatSuccess(chatId));
      } else {
        dispatch(fetchChatsFailure("Failed to delete chat"));
      }
    } catch {
      dispatch(fetchChatsFailure("Failed to delete chat"));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (!input.trim() || !token || isLoading) return;

    let chatIdToUse = currentChatId;

    if (!chatIdToUse) {
      // Create a new chat if none exists
      dispatch(createChatStart());
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          dispatch(createChatSuccess(data));
          chatIdToUse = data._id;
        } else {
          dispatch(createChatFailure(data.message || "Failed to create chat"));
          return;
        }
      } catch {
        dispatch(createChatFailure("Failed to create chat"));
        return;
      }
    }

    if (!chatIdToUse) {
      dispatch(sendMessageFailure("Failed to create or find chat"));
      return;
    }

    const chatId = chatIdToUse;

    dispatch(sendMessageStart());
    try {
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("message", input);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        dispatch(
          sendMessageSuccess({
            userMessage: data.userMessage,
            assistantMessage: data.assistantMessage,
            chatId: data.chatId,
            title: data.title,
          })
        );
        setInput("");
        setSelectedFile(null);
      } else {
        dispatch(sendMessageFailure(data.message || "Failed to send message"));
      }
    } catch {
      dispatch(sendMessageFailure("Failed to send message"));
    }
  };

  return (
    <div className="relative flex flex-col max-h-screen bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <header className="w-full max-w-[810px] p-4 flex items-center justify-center relative shadow-sm">
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="p-2 rounded hover:bg-gray-100 absolute left-4"
        >
          <div className={`transform transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`}>
            {isHistoryOpen ? <FaChevronRight /> : <FaChevronLeft />}
          </div>
        </button>
        <h1 className="font-bold text-lg">AI Chat</h1>
      </header>

      <div className="flex flex-1 w-full mx-auto mt-[84px] mb-[72px] overflow-hidden">
        <aside
          className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shrink-0 overflow-y-auto ${
            isHistoryOpen ? "w-48 sm:w-64" : "w-0 opacity-0"
          }`}
        >
          <div className="p-4 w-48 sm:w-64">
            <Button text="+ New Chat" onClick={handleNewChat} />
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Chats</h3>
            {chatHistory.map((chat, index) => (
              <div
                key={chat._id ?? `chat-${index}`}
                onClick={() => handleLoadChat(chat._id)}
                className={`p-2 rounded-lg cursor-pointer mb-2 flex justify-between items-center ${
                  currentChatId === chat._id
                    ? "bg-green-100 border-l-4 border-[#0D9165]"
                    : "hover:bg-gray-100"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-800">{chat.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(chat._id, e)}
                  className="text-red-500 hover:text-red-700 p-1 rounded"
                  title="Delete Chat"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-gray-500 text-center">
                  No messages yet. Start a conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={`${msg.role}_${index}`}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-[#0D9165] text-white rounded-br-none"
                          : "bg-gray-200 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 z-10 w-full max-w-[810px] backdrop-blur-md bg-white/70 p-4 shadow-sm">
        {error && (
          <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => dispatch(clearError())}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        {selectedFile && (
          <div className="mb-2 p-2 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
            <span>File: {selectedFile.name}</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            onClick={handleUploadClick}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Upload file"
          >
            <FaUpload />
          </button>
          <input
            className="flex-1 border rounded-full px-4 py-2 focus:outline-[#0D9165] bg-white/80 backdrop-blur-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-[#0D9165] text-white px-4 py-2 rounded-full hover:bg-[#0a7a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AiChat;
