// Import Express types for handling HTTP requests and responses in TypeScript
import { Request, Response } from "express";
// Import Mongoose for MongoDB object modeling and validation utilities
import mongoose from "mongoose";
// Import Chat model and its interfaces for type-safe database operations
import Chat, { IMessage, IChat } from "../models/Chat";
// Import OpenAI service for AI-powered chat functionality
import { OpenAIService } from "../utils/openai";
import { webSearch } from "../services/websearch";

// Extend Express Request interface to include authenticated user information
interface AuthRequest extends Request {
  user?: { id: string; email?: string };
}

// Export an asynchronous function to create a new chat session for an authenticated user
export const createChat = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Create a new chat document in the database with default title and empty messages array
    const newChat = await Chat.create({
      title: "New Chat", // Default title for new chats
      messages: [], // Initialize with empty messages array
      userId: req.user.id, // Associate chat with the authenticated user
    });
    // Return the newly created chat with a 201 Created status
    res.status(201).json(newChat);
  } catch (error) {
    // Return a 500 Internal Server Error response if chat creation fails
    res.status(500).json({ message: "Failed to create chat" });
  }
};

// Export an asynchronous function to retrieve all chats for an authenticated user
export const getChats = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Query the database for all chats belonging to the user, sorted by most recently updated first
    const chats = await Chat.find({ userId: req.user.id }).sort({
      updatedAt: -1, // Sort in descending order of update time
    });
    // Filter out any chats with invalid MongoDB ObjectIds to ensure data integrity
    const validChats = chats.filter(
      (chat) => mongoose.isValidObjectId(chat._id) // Validate ObjectId format
    );
    // Return the filtered list of valid chats as JSON response
    res.json(validChats);
  } catch (error) {
    // Return a 500 Internal Server Error response if fetching chats fails
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

// Export an asynchronous function to retrieve a specific chat by ID for an authenticated user
export const getChat = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Extract chatId from request parameters
    const { chatId } = req.params;
    // Validate that chatId is provided and is a valid MongoDB ObjectId
    if (!chatId || !mongoose.isValidObjectId(chatId)) {
      // Return a 400 Bad Request response for invalid chat ID
      return res.status(400).json({ message: "Invalid chat ID" });
    }
    // Query the database for the specific chat, ensuring it belongs to the authenticated user
    const chat = await Chat.findOne({
      _id: chatId, // Match the chat ID
      userId: req.user.id, // Ensure ownership by the user
    });
    // Return a 404 Not Found response if the chat doesn't exist or doesn't belong to the user
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    // Return the chat data as JSON response
    res.json(chat);
  } catch (error) {
    // Return a 500 Internal Server Error response if fetching the chat fails
    res.status(500).json({ message: "Failed to fetch chat" });
  }
};

// Export an asynchronous function to delete a specific chat for an authenticated user
export const deleteChat = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Attempt to find and delete the chat, ensuring it belongs to the authenticated user
    const deleted = await Chat.findOneAndDelete({
      _id: req.params.chatId, // Match the chat ID from request parameters
      userId: req.user.id, // Ensure ownership by the user
    });
    // Return a 404 Not Found response if the chat doesn't exist or doesn't belong to the user
    if (!deleted) return res.status(404).json({ message: "Chat not found" });
    // Return a success message as JSON response
    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    // Return a 500 Internal Server Error response if deletion fails
    res.status(500).json({ message: "Failed to delete chat" });
  }
};

// Export an asynchronous function to clear all chats for an authenticated user
export const clearAllChats = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Delete all chats belonging to the authenticated user
    const result = await Chat.deleteMany({ userId: req.user.id });
    // Return a success message with the number of deleted chats
    res.json({
      message: "All chats cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    // Return a 500 Internal Server Error response if clearing fails
    res.status(500).json({ message: "Failed to clear chats" });
  }
};

// Export an asynchronous function to send a message in a chat, potentially with file attachment and AI response
export const sendMessage = async (req: AuthRequest, res: Response) => {
  // Wrap the entire function in a try-catch block to handle potential errors
  try {
    // Check if the user is authenticated by verifying the presence of req.user
    if (!req.user) {
      // Return a 401 Unauthorized response if user is not authenticated
      return res.status(401).json({ message: "User not authenticated" });
    }
    // Extract chatId and message from request body
    const { chatId, message } = req.body;
    // Extract any uploaded file from the request (handled by multer middleware)
    const file = req.file;

    // Extract file from request for processing

    // Validate that both chatId and message are provided
    if (!chatId || !message) {
      // Return a 400 Bad Request response if required fields are missing
      return res.status(400).json({ message: "Chat ID and message required" });
    }

    // Validate message length to prevent abuse and ensure reasonable processing
    if (message.length > 10000) {
      // Return a 400 Bad Request response if message exceeds maximum length
      return res
        .status(400)
        .json({ message: "Message too long (max 10000 characters)" });
    }

    // Initialize variable to hold extracted file content
    let fileContent = "";
    // Check if a file was uploaded with the request
    if (file) {
      try {
        // Extract text content from the uploaded file buffer
        fileContent = await OpenAIService.extractTextFromBuffer(
          file.buffer, // File buffer containing the file data
          file.originalname // Original filename for format detection
        );
      } catch (error) {
        // Continue processing without file content if extraction fails
        fileContent = "";
      }
    }

    // Retrieve the chat from database, ensuring it belongs to the authenticated user
    const chat = await Chat.findOne({ _id: chatId, userId: req.user!.id });
    // Return a 404 Not Found response if chat doesn't exist or doesn't belong to user
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Create a user message object with the message content and optional file content
    const userMessage: IMessage = {
      role: "user", // Indicate this is a user message
      content: fileContent
        ? `${message}\n\nFile Content:\n${fileContent}` // Include file content if available
        : message, // Use message content only if no file
      timestamp: new Date(), // Record the current timestamp
    };

    // Add the user message to the chat's messages array
    chat.messages.push(userMessage);

    // Use OpenAI as primary AI service for chat messages
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for AI chat functionality");
    }

    // Build conversation history for prompt
    const conversationHistory = chat.messages
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    // Check if the query is about current events, future events, or needs web search
    const needsSearch =
      // US Politics
      /who is (the )?(president|current president|us president)/i.test(
        userMessage.content
      ) ||
      /current (president|us president)/i.test(userMessage.content) ||
      /who (won|is|will be) (president|us president)/i.test(
        userMessage.content
      ) ||
      /2024 election/i.test(userMessage.content) ||
      /2025 (president|election|candidates)/i.test(userMessage.content) ||
      /future (president|election)/i.test(userMessage.content) ||
      /next (president|election)/i.test(userMessage.content) ||
      /who will (win|be) (president|us president)/i.test(userMessage.content) ||
      /presidential (election|candidates|race)/i.test(userMessage.content) ||
      /latest news/i.test(userMessage.content) ||
      /current (year|date|time|events)/i.test(userMessage.content) ||
      /upcoming election/i.test(userMessage.content) ||
      /election (results|candidates|polls)/i.test(userMessage.content) ||
      // General current data patterns
      /what is the (latest|current|most recent)/i.test(userMessage.content) ||
      /tell me about (current|recent|latest)/i.test(userMessage.content) ||
      /what's happening (now|currently|today)/i.test(userMessage.content) ||
      /current (price|rate|value|status|situation)/i.test(userMessage.content) ||
      /latest (update|information|news|data)/i.test(userMessage.content) ||
      /as of (today|now|currently)/i.test(userMessage.content) ||
      /what is the (current|latest) (news|information|data)/i.test(userMessage.content);

    let assistantContent: string;

    if (needsSearch) {
      try {
        // Extract search query from the message
        let searchQuery = userMessage.content;

        // Specific mappings for known queries
        if (
          /who is (the )?(president|current president|us president)/i.test(
            userMessage.content
          ) ||
          /current (president|us president)/i.test(userMessage.content) ||
          /who (won|is) (president|us president)/i.test(userMessage.content)
        ) {
          searchQuery = "current president of the United States";
        } else if (
          /who will (win|be) (president|us president)/i.test(
            userMessage.content
          ) ||
          /2024 election/i.test(userMessage.content) ||
          /2025 (president|election|candidates)/i.test(userMessage.content) ||
          /future (president|election)/i.test(userMessage.content) ||
          /next (president|election)/i.test(userMessage.content) ||
          /presidential (election|candidates|race)/i.test(userMessage.content) ||
          /election (results|candidates|polls)/i.test(userMessage.content) ||
          /upcoming election/i.test(userMessage.content)
        ) {
          searchQuery = "2024 US presidential election results";
        } else {
          // For general current data queries, clean up the query
          searchQuery = userMessage.content
            .replace(/tell me about/i, '')
            .replace(/what is the/i, '')
            .replace(/what's/i, '')
            .replace(/current|latest|recent|now|today/gi, '')
            .replace(/please|can you|could you/gi, '')
            .trim();

          // Add current year if not present and seems like a current events query
          if (!/\d{4}/.test(searchQuery) && /news|information|data|update|status/i.test(userMessage.content)) {
            const currentYear = new Date().getFullYear();
            searchQuery += ` ${currentYear}`;
          }
        }

        // Perform web search
        const searchResults = await webSearch(searchQuery, 3);

        // Build enhanced prompt with search results
        const searchContext = searchResults
          .map(
            (result) =>
              `Source: ${result.title}\n${result.snippet}\nURL: ${
                result.url || "N/A"
              }\n---`
          )
          .join("\n");

        const enhancedPrompt = `${conversationHistory}\n\nUser: ${userMessage.content}\n\nSearch Results:\n${searchContext}\n\nBased on the above search results, provide a helpful and accurate response. If the information is about current events, use the most recent data available.`;

        assistantContent = await OpenAIService.generateChatResponse(
          enhancedPrompt,
          undefined,
          512
        );
      } catch (searchError) {
        console.error("Search integration failed:", searchError);
        // Fall back to regular OpenAI response
        const prompt = `${conversationHistory}\n\nUser: ${userMessage.content}\nAssistant:`;
        assistantContent = await OpenAIService.generateChatResponse(
          prompt,
          undefined,
          512
        );
      }
    } else {
      // Use regular OpenAI service for non-search queries
      const prompt = `${conversationHistory}\n\nUser: ${userMessage.content}\nAssistant:`;
      assistantContent = await OpenAIService.generateChatResponse(
        prompt,
        undefined,
        512
      );
    }

    // Create an assistant message object with the AI-generated response
    const assistantMessage: IMessage = {
      role: "assistant", // Indicate this is an AI assistant message
      content: assistantContent, // The AI-generated response content
      timestamp: new Date(), // Record the current timestamp
    };

    // Add the assistant message to the chat's messages array
    chat.messages.push(assistantMessage);

    // Initialize variable to hold any updated chat title
    let updatedTitle: string | undefined;
    // Check if this is the first message pair and the chat still has the default title
    if (chat.messages.length === 2 && chat.title === "New Chat") {
      try {
        // Use OpenAI service to generate a descriptive title for the chat based on the first user message
        const titlePrompt = `Generate a short, descriptive title (max 50 characters) for this conversation based on the user's first message: "${message}"`;
        const generatedTitle = await OpenAIService.generateChatResponse(
          titlePrompt,
          undefined,
          50
        );
        const cleanedTitle = generatedTitle.trim().replace(/^["']|["']$/g, ""); // Remove quotes if present
        // Update the chat title with the generated title
        chat.title = cleanedTitle;
        // Store the updated title for response
        updatedTitle = cleanedTitle;
      } catch (error) {
        // Log any errors during title generation
        console.error("Title generation error:", error);
        // Keep the default title if generation fails
      }
    }

    // Save the updated chat document to the database
    await chat.save();

    // Send activity notification email for new chat creation
    if (chat.messages.length === 2) {
      // First message pair (user + assistant)
      try {
        // Dynamically import notification service to avoid circular dependencies
        const { notificationService } = await import(
          "../services/notificationService.js"
        );
        // Check if user has an email address for notifications
        if (req.user.email) {
          // Send notification email about the new chat activity
          await notificationService.sendActivityNotification(
            req.user.email,
            "chat",
            {
              title: chat.title, // Include chat title in notification
              createdAt: chat.createdAt, // Include creation timestamp
            }
          );
        }
      } catch (emailError) {
        // Log any errors during email sending
        console.error("Failed to send chat notification email:", emailError);
        // Don't fail the message sending if email notification fails
      }
    }

    // Return the message exchange details as JSON response
    res.json({
      userMessage, // The user's message
      assistantMessage, // The AI assistant's response
      chatId: chat._id, // The chat ID for reference
      ...(updatedTitle && { title: updatedTitle }), // Include updated title if generated
    });
  } catch (error) {
    // Log any errors that occurred during message processing
    console.error("Chat message error:", error);
    // Extract error message for response, defaulting to generic message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Return a 500 Internal Server Error response with error details
    res.status(500).json({ message: "AI service failed", error: errorMessage });
  }
};
