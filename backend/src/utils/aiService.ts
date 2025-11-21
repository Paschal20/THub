import { OpenAIService } from "./openai";

/**
 * Unified AI service for file processing
 * All AI functionality now uses OpenAI
 */
export class AIService {
  /**
   * Extract text content from a file buffer using OpenAI
   */
  static async extractTextFromBuffer(
    buffer: Buffer,
    originalname: string
  ): Promise<string> {
    return await OpenAIService.extractTextFromBuffer(buffer, originalname);
  }
}
