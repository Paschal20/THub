import express from "express";
import Conversation from "../models/Conversation";
import { webSearch } from "../services/websearch";
import { OpenAIService } from "../utils/openai";

const router = express.Router();

/**
 * POST /api/chat
 * body: {
 *   conversationId?: string,
 *   message: string,
 *   search?: boolean, // include web search context
 *   searchCount?: number
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      conversationId,
      message,
      search = false,
      searchCount = 3,
    } = req.body;
    if (!message || typeof message !== "string")
      return res.status(400).json({ error: "message required" });

    let conv = null;
    if (conversationId) conv = await Conversation.findById(conversationId);
    if (!conv)
      conv = new Conversation({ title: message.slice(0, 80), messages: [] });

    conv.messages.push({ role: "user", text: message, timestamp: new Date() });

    let prompt = message;

    if (search) {
      try {
        const results = await webSearch(message, searchCount);
        const snippets = results
          .map(
            (r, i) =>
              `Result ${i + 1}: ${r.title}\n${r.snippet ?? ""}\n${r.url ?? ""}`
          )
          .join("\n\n");
        prompt = `User query: ${message}\n\nRelevant search results (DuckDuckGo Instant Answer):\n${snippets}\n\nUsing the above results, provide a concise answer and cite any URLs when possible.`;
      } catch (err) {
        console.warn("web search failed:", err);
        // fallback to prompt with conversational context
        const lastMsgs = conv.messages
          .slice(-6)
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
          .join("\n");
        prompt = `${lastMsgs}\n\nUser: ${message}\nAssistant:`;
      }
    } else {
      const lastMsgs = conv.messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
        .join("\n");
      prompt = `${lastMsgs}\n\nUser: ${message}\nAssistant:`;
    }

    // Use OpenAI for chat responses
    const assistantText = await OpenAIService.generateChatResponse(prompt);
    conv.messages.push({
      role: "assistant",
      text: assistantText,
      timestamp: new Date(),
    });

    await conv.save();

    res.json({
      conversationId: conv._id,
      assistant: assistantText,
      conversation: conv,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "internal_error", detail: (err as Error).message });
  }
});

export default router;
