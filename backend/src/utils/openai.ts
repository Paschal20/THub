import fs from "fs";
import path from "path";
const pdf = require("pdf-parse");
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI service for quiz generation, file processing, and chat responses
 */
export class OpenAIService {
  /**
   * Extract text content from a file on disk
   */
  static async extractTextFromFile(filePath: string): Promise<string> {
    try {
      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".txt") {
        return fs.readFileSync(filePath, "utf-8");
      } else if (ext === ".pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if ([".doc", ".docx"].includes(ext)) {
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } else {
        return `Unsupported file type: ${ext}`;
      }
    } catch (error) {
      console.error("File extraction error:", error);
      throw new Error("Failed to extract text from file");
    }
  }

  /**
   * Generate a chat response using OpenAI's GPT-4o-mini model
   */
  static async generateChatResponse(
    conversationHistory: string,
    searchContext?: string,
    maxTokens: number = 512
  ): Promise<string> {
    try {
      let prompt = conversationHistory;

      if (searchContext) {
        prompt = `${conversationHistory}\n\nSearch Results:\n${searchContext}\n\nBased on the above search results, provide a helpful and accurate response. If the information is about current events, use the most recent data available.`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from OpenAI");
      }

      return responseText;
    } catch (error: any) {
      console.error("OpenAI chat error:", error);
      throw new Error(
        error.message || "Failed to generate chat response from OpenAI"
      );
    }
  }

  /**
   * Extract text content from a file buffer
   */
  static async extractTextFromBuffer(
    buffer: Buffer,
    originalname: string
  ): Promise<string> {
    try {
      const ext = path.extname(originalname).toLowerCase();

      if (ext === ".txt") {
        return buffer.toString("utf-8");
      } else if (ext === ".pdf") {
        const data = await pdf(buffer);
        return data.text;
      } else if ([".doc", ".docx"].includes(ext)) {
        const mammoth = require("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else {
        return `Unsupported file type: ${ext}`;
      }
    } catch (error) {
      console.error("Buffer extraction error:", error);
      throw new Error("Failed to extract text from buffer");
    }
  }
}
