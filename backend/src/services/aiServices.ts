

import OpenAI from "openai";
import { QuizQuestion } from "../types/index.js";
import {
  ContentProcessor,
  CacheService,
  ValidationService,
} from "./contentProcessor";

import dotenv from "dotenv";
dotenv.config();

interface QuizGenerationOptions {
  content?: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questionTypes: string[];
  language?: string;
  userId: string;
}

interface QuizGenerationResult {
  questions: QuizQuestion[];
  metadata: {
    generationTime: number;
    modelUsed: string;
    contentLength?: number;
    cacheHit: boolean;
  };
}

export class QuizGenerationService {
  private openai: OpenAI;
  private contentProcessor: ContentProcessor;
  private cacheService: CacheService;
  private validationService: ValidationService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      timeout: 30000,
      maxRetries: 3,
    });
    this.contentProcessor = new ContentProcessor();
    this.cacheService = new CacheService();
    this.validationService = new ValidationService();
  }

  async generateQuiz(
    options: QuizGenerationOptions
  ): Promise<QuizGenerationResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(options);
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return {
          questions: cached,
          metadata: {
            generationTime: Date.now() - startTime,
            modelUsed: "cache",
            cacheHit: true,
          },
        };
      }

      // Process content if provided
      let processedContent = options.content;
      if (options.content) {
        processedContent = await this.contentProcessor.processContent(
          options.content
        );
      }

      // Generate questions using AI
      const generateOptions = {
        ...options,
        ...(processedContent ? { content: processedContent } : {}),
      };
      const questions = await this.generateWithAI(generateOptions);

      // Validate questions
      const validatedQuestions = await this.validationService.validateQuestions(
        questions
      );

      // Cache the results
      await this.cacheService.set(cacheKey, validatedQuestions, 3600); // Cache for 1 hour

      const metadata: QuizGenerationResult["metadata"] = {
        generationTime: Date.now() - startTime,
        modelUsed: "gpt-4",
        cacheHit: false,
      };

      if (processedContent?.length !== undefined) {
        metadata.contentLength = processedContent.length;
      }

      return {
        questions: validatedQuestions,
        metadata,
      };
    } catch (error) {
      console.error("Quiz generation error:", error);
      throw this.handleGenerationError(error);
    }
  }

  private async generateWithAI(
    options: QuizGenerationOptions & { content?: string }
  ): Promise<QuizQuestion[]> {
    const models = [
      { name: "gpt-4", maxRetries: 2, temperature: 0.7 },
      { name: "gpt-3.5-turbo", maxRetries: 1, temperature: 0.8 },
    ];

    for (const modelConfig of models) {
      for (let attempt = 1; attempt <= modelConfig.maxRetries; attempt++) {
        try {
          const prompt = this.buildGenerationPrompt(options);

          const completion = await this.openai.chat.completions.create({
            model: modelConfig.name,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000,
            temperature: modelConfig.temperature,
          });

          const response = completion.choices[0]?.message?.content;
          if (!response) {
            throw new Error("Empty response from AI");
          }

          const questions = this.parseAIResponse(response);
          return this.postProcessQuestions(questions, options);
        } catch (error: any) {
          console.warn(
            `Attempt ${attempt} with ${modelConfig.name} failed:`,
            error.message
          );

          if (attempt < modelConfig.maxRetries) {
            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
            continue;
          }
        }
      }
    }

    throw new Error("All AI models failed to generate quiz");
  }

  private buildGenerationPrompt(
    options: QuizGenerationOptions & { content?: string }
  ): string {
    const context = options.content
      ? `based on the following content:\n${options.content}`
      : `on the topic "${options.topic}"`;

    return `
Generate ${options.numQuestions} quiz questions ${context} at ${
      options.difficulty
    } difficulty level.
Include a mix of these question types: ${options.questionTypes.join(", ")}.

CRITICAL REQUIREMENTS:
1. For multiple-choice: Provide EXACTLY 4 distinct options labeled A, B, C, D
2. For true-false: Provide EXACTLY 2 options: A: "True", B: "False"  
3. For fill-in-the-blank: Provide empty options object and the answer as text
4. All multiple-choice options must be meaningful and plausible
5. Questions should match the ${options.difficulty} difficulty level
6. Include clear explanations for answers

DIFFICULTY GUIDELINES:
- Easy: Basic facts, direct recall
- Medium: Application of concepts, simple analysis
- Hard: Complex analysis, synthesis, evaluation

FORMAT REQUIREMENTS:
Return ONLY valid JSON array following this exact structure:
[
  {
    "question": "Question text?",
    "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
    "answer": "A",
    "explanation": "Clear explanation",
    "type": "multiple-choice",
    "difficulty": "${options.difficulty}"
  }
]

Ensure JSON is valid and properly formatted.
`;
  }

  private parseAIResponse(response: string): QuizQuestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const questions = JSON.parse(jsonMatch[0]);

      // Basic validation
      if (!Array.isArray(questions)) {
        throw new Error("Response is not an array");
      }

      if (questions.length === 0) {
        throw new Error("Empty questions array");
      }

      return questions;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error("Invalid response format from AI");
    }
  }

  private postProcessQuestions(
    questions: any[],
    options: QuizGenerationOptions
  ): QuizQuestion[] {
    return questions.map((q, index) => ({
      question: q.question?.trim() || `Question ${index + 1}`,
      options: this.normalizeOptions(q.options, q.type),
      answer: this.normalizeAnswer(q.answer, q.type),
      explanation: q.explanation?.trim() || "No explanation provided",
      type: this.validateQuestionType(q.type),
      difficulty: options.difficulty,
    }));
  }

  private normalizeOptions(
    options: any,
    type: string
  ): { A: string; B: string; C: string; D: string } {
    const defaultOptions = { A: "", B: "", C: "", D: "" };

    if (type === "fill-in-the-blank") {
      return defaultOptions;
    }

    if (type === "true-false") {
      return {
        A: "True",
        B: "False",
        C: "",
        D: "",
      };
    }

    // For multiple-choice, ensure all options are filled
    if (typeof options === "object" && options !== null) {
      return {
        A: options.A?.trim() || "Option A",
        B: options.B?.trim() || "Option B",
        C: options.C?.trim() || "Option C",
        D: options.D?.trim() || "Option D",
      };
    }

    return defaultOptions;
  }

  private normalizeAnswer(answer: any, type: string): string {
    if (type === "fill-in-the-blank") {
      return String(answer || "").trim();
    }

    // For multiple-choice/true-false, ensure answer is A, B, C, or D
    const normalized = String(answer || "A").toUpperCase();
    return ["A", "B", "C", "D"].includes(normalized) ? normalized : "A";
  }

  private validateQuestionType(
    type: string
  ): "multiple-choice" | "true-false" | "fill-in-the-blank" {
    const validTypes = ["multiple-choice", "true-false", "fill-in-the-blank"];
    return validTypes.includes(type) ? (type as any) : "multiple-choice";
  }

  private generateCacheKey(options: QuizGenerationOptions): string {
    const contentHash = options.content
      ? require("crypto")
          .createHash("md5")
          .update(options.content)
          .digest("hex")
      : "no-content";

    return `quiz:${options.topic}:${options.difficulty}:${
      options.numQuestions
    }:${options.questionTypes.join(",")}:${contentHash}`;
  }

  private handleGenerationError(error: any): Error {
    if (error?.code === "rate_limit_exceeded") {
      return new Error("Rate limit exceeded. Please try again in a moment.");
    }

    if (error?.code === "insufficient_quota") {
      return new Error(
        "Service temporarily unavailable. Please try again later."
      );
    }

    if (error.message?.includes("timeout")) {
      return new Error("Request timeout. Please try again.");
    }

    return new Error(
      "Failed to generate quiz. Please try again with different parameters."
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
