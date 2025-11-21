// src/services/QuizGenerationService.ts
import OpenAI from "openai";
import { QuizQuestion } from "../types/index";
import axios from "axios";
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
  private openai?: OpenAI;
  private readonly MAX_TOKENS = 4096; // Conservative limit that works across all AI providers

  constructor() {
    // Only initialize OpenAI if not in mock mode
    if (process.env.MOCK_AI !== "true") {
      if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API key is not configured!");
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Local deterministic question generator used for MOCK_AI mode.
   * Generates simple multiple-choice / true-false questions from topic or provided content.
   */
  private generateLocalQuestions(
    options: QuizGenerationOptions
  ): QuizQuestion[] {
    const n = Math.max(1, Math.min(20, options.numQuestions || 1));
    const out: QuizQuestion[] = [];
    const seedText =
      (options.content && options.content.trim()) || options.topic;

    for (let i = 0; i < n; i++) {
      const qType =
        options.questionTypes &&
        options.questionTypes[i % options.questionTypes.length]
          ? options.questionTypes[i % options.questionTypes.length]
          : "multiple-choice";

      const base = `Question ${i + 1} about ${options.topic}`;
      const questionText = options.content
        ? `Based on the provided material: ${this.truncate(
            seedText,
            200
          )} — ${base}`
        : `${base}: What is a key idea related to ${options.topic}?`;

      // Declare variables for question generation
      const isMathTopic = this.isMathTopic(options.topic);
      let questionOptions: any;
      let answer: string;
      let explanation: string;
      let finalQuestionText = questionText;

      if (qType === "true-false") {
        out.push({
          question: questionText,
          options: { A: "True", B: "False", C: "", D: "" },
          answer: i % 2 === 0 ? "A" : "B",
          explanation: `Auto-generated true/false for ${options.topic}`,
          type: "true-false",
          difficulty: options.difficulty,
        } as any);
        continue;
      }

      if (qType === "fill-in-the-blank") {
        // Fill-in-the-blank questions now display options for better UX
        if (isMathTopic) {
          // Use the same math generation logic for consistency
          const mathQuestion = this.generateMathQuestion(options.topic, options.difficulty, i);
          questionOptions = mathQuestion.options;
          answer = mathQuestion.answer;
          explanation = mathQuestion.explanation;
          finalQuestionText = mathQuestion.question;
        } else {
          // For non-math topics, provide sample options
          const sampleOptions = ["Option A", "Option B", "Option C", "Option D"];
          const correctIndex = Math.floor(Math.random() * 4);
          answer = String.fromCharCode(65 + correctIndex); // A, B, C, or D

          questionOptions = {
            A: sampleOptions[0],
            B: sampleOptions[1],
            C: sampleOptions[2],
            D: sampleOptions[3],
          };

          explanation = `Auto-generated fill-in-the-blank based on ${options.topic}`;
        }
      } else if (isMathTopic && qType === "multiple-choice") {
        // Generate mathematically accurate questions for math topics
        const mathQuestion = this.generateMathQuestion(options.topic, options.difficulty, i);
        questionOptions = mathQuestion.options;
        answer = mathQuestion.answer;
        explanation = mathQuestion.explanation;
        finalQuestionText = mathQuestion.question;
      } else {
        // Default non-math generation
        const optionBase = this.truncate(seedText, 40);
        const answers = ["A", "B", "C", "D"];
        questionOptions = {
          A: `${optionBase} (A)`,
          B: `${optionBase} (B)`,
          C: `${optionBase} (C)`,
          D: `${optionBase} (D)`,
        };
        answer = answers[i % answers.length] ?? "A";
        explanation = `Auto-generated choices based on ${options.topic}`;
      }

      out.push({
        question: finalQuestionText,
        options: questionOptions,
        answer,
        explanation,
        type: qType as "multiple-choice" | "true-false" | "fill-in-the-blank",
        difficulty: options.difficulty,
      });
    }

    return out;
  }

  private truncate(s: string, max = 100) {
    if (!s) return "";
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  private isMathTopic(topic: string): boolean {
    const mathKeywords = [
      'math', 'mathematics', 'algebra', 'geometry', 'calculus', 'trigonometry',
      'statistics', 'probability', 'arithmetic', 'equation', 'function', 'integral',
      'derivative', 'matrix', 'vector', 'coordinate', 'graph', 'number', 'fraction',
      'decimal', 'percentage', 'ratio', 'proportion', 'sequence', 'series'
    ];
    const lowerTopic = topic.toLowerCase();
    return mathKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  private generateMathQuestion(topic: string, difficulty: string, index: number): {
    question: string;
    options: { A: string; B: string; C: string; D: string };
    answer: string;
    explanation: string;
  } {
    const lowerTopic = topic.toLowerCase();

    // Simple arithmetic questions
    if (lowerTopic.includes('arithmetic') || lowerTopic.includes('basic math')) {
      const num1 = Math.floor(Math.random() * 20) + 1;
      const num2 = Math.floor(Math.random() * 20) + 1;
      const operations = ['+', '-', '*'];
      const operation = operations[index % operations.length];

      let result: number;
      let question: string;
      let wrongOptions: number[];

      switch (operation) {
        case '+':
          result = num1 + num2;
          question = `What is ${num1} + ${num2}?`;
          wrongOptions = [result + 1, result - 1, result + 2];
          break;
        case '-':
          result = num1 - num2;
          question = `What is ${num1} - ${num2}?`;
          wrongOptions = [result + 1, result - 1, num1 + num2];
          break;
        case '*':
          result = num1 * num2;
          question = `What is ${num1} × ${num2}?`;
          wrongOptions = [num1 + num2, num1 * (num2 + 1), (num1 + 1) * num2];
          break;
        default:
          result = num1 + num2;
          question = `What is ${num1} + ${num2}?`;
          wrongOptions = [result + 1, result - 1, result + 2];
      }

      const options = [result, ...wrongOptions];
      const shuffledOptions = this.shuffleArray(options);

      return {
        question,
        options: {
          A: shuffledOptions[0]?.toString() || "0",
          B: shuffledOptions[1]?.toString() || "0",
          C: shuffledOptions[2]?.toString() || "0",
          D: shuffledOptions[3]?.toString() || "0",
        },
        answer: String.fromCharCode(65 + shuffledOptions.indexOf(result)),
        explanation: `The correct answer is ${result}. This is a basic ${operation === '*' ? 'multiplication' : operation === '-' ? 'subtraction' : 'addition'} operation.`,
      };
    }

    // Algebra questions
    if (lowerTopic.includes('algebra') || lowerTopic.includes('equation')) {
      const a = Math.floor(Math.random() * 5) + 1; // x = a
      const b = Math.floor(Math.random() * 10) + 1; // constant term

      // Equation: 2x + b = 2a + b
      // Solution: x = a
      const rightSide = 2 * a + b;

      const question = `Solve for x: 2x + ${b} = ${rightSide}`;
      const correctAnswer = a;
      const wrongOptions = [a + 1, a - 1, a + 2];

      const options = [correctAnswer, ...wrongOptions];
      const shuffledOptions = this.shuffleArray(options);

      return {
        question,
        options: {
          A: shuffledOptions[0]?.toString() || "0",
          B: shuffledOptions[1]?.toString() || "0",
          C: shuffledOptions[2]?.toString() || "0",
          D: shuffledOptions[3]?.toString() || "0",
        },
        answer: String.fromCharCode(65 + shuffledOptions.indexOf(correctAnswer)),
        explanation: `Subtract ${b} from both sides: 2x = ${rightSide - b}. Divide by 2: x = ${(rightSide - b) / 2}.`,
      };
    }

    // Default math question
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const result = num1 * num2;
    const question = `What is ${num1} × ${num2}?`;
    const wrongOptions = [num1 + num2, num1 * (num2 + 1), (num1 + 1) * num2];

    const options = [result, ...wrongOptions];
    const shuffledOptions = this.shuffleArray(options);

    return {
      question,
      options: {
        A: shuffledOptions[0]?.toString() || "0",
        B: shuffledOptions[1]?.toString() || "0",
        C: shuffledOptions[2]?.toString() || "0",
        D: shuffledOptions[3]?.toString() || "0",
      },
      answer: String.fromCharCode(65 + shuffledOptions.indexOf(result)),
      explanation: `The correct answer is ${result}. This is a multiplication of ${num1} and ${num2}.`,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
    return shuffled;
  }

  async generateQuiz(
    options: QuizGenerationOptions
  ): Promise<QuizGenerationResult> {
    const startTime = Date.now();
    const maxRetries = 1;

    try {
      let questions: QuizQuestion[] = [];
      let modelUsed = "mock";
      let cacheHit = false;

      // Check if MOCK_AI is enabled
      if (process.env.MOCK_AI === "true") {
        questions = this.generateLocalQuestions(options);
        modelUsed = "mock";
        cacheHit = true;
       } else {
         // Use OpenAI for quiz generation
         for (let attempt = 0; attempt < maxRetries; attempt++) {
           try {
             questions = await this.generateWithOpenAI(options);
             modelUsed = "gpt-3.5-turbo";
             break;

            // Filter out invalid questions and accept partial results
            const validQuestions = this.filterValidQuestions(questions);
            if (validQuestions.length === 0) {
              console.warn(
                `No valid questions from OpenAI: got ${questions.length} total, 0 valid`
              );
              if (attempt === maxRetries - 1) {
                // Fall back to mock generation if no valid questions at all
                console.log(
                  "Falling back to mock generation due to no valid AI response"
                );
                questions = this.generateLocalQuestions(options);
                modelUsed = "mock-fallback";
                cacheHit = false;
              } else {
                // Try again
                continue;
              }
            } else if (validQuestions.length < options.numQuestions) {
              console.warn(
                `Partial response from OpenAI: got ${validQuestions.length} valid questions out of ${options.numQuestions} requested`
              );
              // Accept partial results - better to send some questions than none
              questions = validQuestions;
              modelUsed = "openai-partial";
            } else {
              // Full valid response
              questions = validQuestions;
            }

            break; // Success, exit retry loop
           } catch (error: any) {
             console.error(
               `Attempt ${attempt + 1} failed for OpenAI:`,
               error
             );
             if (attempt === maxRetries - 1) {
               throw this.handleGenerationError(error);
             }
             // Wait before retry
             await new Promise((resolve) =>
               setTimeout(resolve, 1000 * (attempt + 1))
             );
           }
        }
      }

      const generationTime = Date.now() - startTime;

      return {
        questions,
        metadata: {
          generationTime,
          modelUsed,
          contentLength: options.content?.length ?? 0,
          cacheHit,
        },
      };
    } catch (error: any) {
      throw this.handleGenerationError(error);
    }
  }



  private async generateWithOpenAI(
    options: QuizGenerationOptions
  ): Promise<QuizQuestion[]> {
    try {
      console.log("Calling OpenAI API...");
      const prompt = this.buildPrompt(options);

      if (!this.openai) {
        throw new Error("OpenAI client not initialized");
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: this.MAX_TOKENS,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("Empty response from OpenAI");
      }

      return this.parseJSONFromString(response);
    } catch (error: any) {
      console.error("OpenAI API error:", {
        error,
        message: error?.message,
        status: error?.status,
        code: error?.code,
      });
      throw error;
    }
  }

  private buildPrompt(options: QuizGenerationOptions): string {
    const context = options.content
      ? `based on the following content:\n${options.content}`
      : `on the topic "${options.topic}"`;

    const isMathTopic = this.isMathTopic(options.topic);

    const difficultyGuidelines = {
      easy: "Questions should require some analytical thinking and application of concepts, not just direct recall. They should be suitable for a knowledgeable high school student.",
      medium: "intermediate understanding, application of concepts, moderate analysis and problem-solving",
      hard: "advanced standardized exam level difficulty - equivalent to SAT, ACT, GCSE A-Levels, JEE, NEET, Abitur, Baccalauréat: requiring critical thinking, complex reasoning, inference, analytical skills, and deep conceptual understanding"
    };

    return `
Generate EXACTLY ${options.numQuestions} quiz questions ${context} at ${options.difficulty} difficulty level.

DIFFICULTY GUIDELINES (${options.difficulty}):
- Focus on: ${difficultyGuidelines[options.difficulty as keyof typeof difficultyGuidelines]}
- ${options.difficulty === 'hard' ? 'Create questions equivalent to standardized exams (SAT, ACT, GCSE A-Levels, JEE, NEET, Abitur, Baccalauréat): require analytical reasoning, inference from complex scenarios, application of advanced concepts, critical evaluation, and discrimination between nuanced ideas. Avoid simple recall.' : ''}
- ${options.difficulty === 'medium' ? 'Include questions that require application and analysis of concepts, going beyond basic recall but not requiring advanced standardized exam-level reasoning.' : ''}
- ${options.difficulty === 'easy' ? 'Questions should require some analytical thinking and application of concepts, not just direct recall. They should be suitable for a knowledgeable high school student.' : ''}

REQUIREMENTS:
1. Generate EXACTLY ${options.numQuestions} questions
2. Include question types: ${options.questionTypes.join(", ")}
3. Multiple-choice: 4 options (A, B, C, D) with one correct answer
4. True-false: 2 options (A: True, B: False)
5. Fill-in-blank: 4 options (A, B, C, D) with meaningful values
6. All answers must be option keys (A, B, C, or D)
${isMathTopic ? '7. For math questions: ensure calculations are accurate and wrong options are common mistakes' : ''}

Return ONLY a valid JSON array:
[{
  "question": "Question text?",
  "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
  "answer": "A",
  "explanation": "Explanation here",
  "type": "multiple-choice",
  "difficulty": "${options.difficulty}"
}]
 `;
  }

  private parseJSONFromString(raw: string): QuizQuestion[] {
    // Clean the raw response
    let cleaned = this.cleanJSONResponse(raw);

    // Try to extract JSON array
    const match = cleaned.match(/\[[\s\S]*\]/);
    const candidate = match ? match[0] : cleaned;

    try {
      const parsed = JSON.parse(candidate);
      if (!Array.isArray(parsed)) {
        throw new Error("Parsed result is not an array");
      }
      return this.normalizeQuestions(parsed);
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      console.error("Raw response:", raw);
      console.error("Cleaned candidate:", candidate);

      // Try alternative parsing strategies
      try {
        const alternativeParsed = this.parseMalformedJSON(candidate);
        if (Array.isArray(alternativeParsed)) {
          console.log("Successfully parsed using alternative method");
          return this.normalizeQuestions(alternativeParsed);
        }
      } catch (altErr) {
        console.error("Alternative parsing also failed:", altErr);
      }

      throw new Error("Failed to parse quiz questions from AI response");
    }
  }

  private cleanJSONResponse(raw: string): string {
    let cleaned = raw.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*$/g, "");

    // Remove any text before the first '['
    const firstBracket = cleaned.indexOf("[");
    if (firstBracket > 0) {
      cleaned = cleaned.substring(firstBracket);
    }

    // Remove any text after the last ']'
    const lastBracket = cleaned.lastIndexOf("]");
    if (lastBracket >= 0 && lastBracket < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBracket + 1);
    }

    // Only remove trailing commas before closing brackets - this is the most common issue
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

    return cleaned;
  }

  private parseMalformedJSON(input: string): any[] {
    // Sanitize the input string
    const sanitized = this.sanitizeJSONString(input);

    try {
      return JSON.parse(sanitized);
    } catch (err) {
      console.error(
        "Standard JSON parse failed, attempting manual parsing:",
        err
      );

      // Try to extract individual JSON objects from malformed array
      const objects = this.extractJSONObjectStrings(sanitized);
      if (objects.length > 0) {
        const parsedObjects = objects
          .map((obj) => {
            try {
              return JSON.parse(obj);
            } catch (e) {
              console.warn("Failed to parse individual object:", obj, e);
              return null;
            }
          })
          .filter((obj) => obj !== null);

        if (parsedObjects.length > 0) {
          return parsedObjects;
        }
      }

      throw err; // Re-throw if all attempts fail
    }
  }

  private sanitizeJSONString(input: string): string {
    return (
      input
        .replace(/[\u0000-\u001F]+/g, "") // Remove control characters
        .replace(/\\n/g, "\\n") // Escape newlines
        .replace(/\\r/g, "\\r") // Escape carriage returns
        .replace(/\\t/g, "\\t") // Escape tabs
        .replace(/,\s*]/g, "]") // Remove trailing commas
        .replace(/,\s*}/g, "}") // Remove trailing commas in objects
        // Quote unquoted object keys
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    );
  }

  private extractJSONObjectStrings(input: string): string[] {
    const objects: string[] = [];
    let braceCount = 0;
    let startIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") {
        if (braceCount === 0) {
          startIndex = i;
        }
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          objects.push(input.substring(startIndex, i + 1));
          startIndex = -1;
        }
      }
    }

    return objects;
  }

  private normalizeQuestions(questions: any[]): QuizQuestion[] {
    return questions.map((q, index) => ({
      question: q.question?.trim() || `Question ${index + 1}`,
      options: this.normalizeOptions(q.options, q.type),
      answer: this.normalizeAnswer(q.answer, q.type),
      explanation: q.explanation?.trim() || "No explanation provided",
      type: this.validateQuestionType(q.type),
      difficulty: q.difficulty,
    }));
  }

  private normalizeOptions(
    options: any,
    type: string
  ): { A: string; B: string; C: string; D: string } {
    const defaultOptions = { A: "", B: "", C: "", D: "" };

    if (type === "true-false") {
      return { A: "True", B: "False", C: "", D: "" };
    }

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
    const normalized = String(answer || "A").toUpperCase();
    return ["A", "B", "C", "D"].includes(normalized) ? normalized : "A";
  }

  private validateQuestionType(
    type: string
  ): "multiple-choice" | "true-false" | "fill-in-the-blank" {
    const validTypes = ["multiple-choice", "true-false", "fill-in-the-blank"];
    return validTypes.includes(type) ? (type as any) : "multiple-choice";
  }

  private filterValidQuestions(questions: any[]): QuizQuestion[] {
    if (!Array.isArray(questions)) {
      return [];
    }

    // Filter out invalid questions and normalize valid ones
    return questions
      .filter((question) => {
        if (!question || typeof question !== "object") {
          return false;
        }

        if (!question.question || typeof question.question !== "string") {
          return false;
        }

        if (!question.explanation || typeof question.explanation !== "string") {
          return false;
        }

        if (
          !question.type ||
          !["multiple-choice", "true-false", "fill-in-the-blank"].includes(
            question.type
          )
        ) {
          return false;
        }

        if (!question.answer || typeof question.answer !== "string") {
          return false;
        }

        // Validate options based on question type
        if (question.type === "multiple-choice") {
          if (!question.options || typeof question.options !== "object") {
            return false;
          }
          const { A, B, C, D } = question.options;
          if (!A || !B || !C || !D) {
            return false;
          }
          if (!["A", "B", "C", "D"].includes(question.answer)) {
            return false;
          }
        } else if (question.type === "true-false") {
          if (!question.options || typeof question.options !== "object") {
            return false;
          }
          const { A, B } = question.options;
          if (A !== "True" || B !== "False") {
            return false;
          }
          if (!["A", "B"].includes(question.answer)) {
            return false;
          }
        } else if (question.type === "fill-in-the-blank") {
          // For fill-in-blank, options should have meaningful values and answer should be A, B, C, or D
          if (!question.options || typeof question.options !== "object") {
            return false;
          }
          const { A, B, C, D } = question.options;
          if (!A || !B || !C || !D) {
            return false;
          }
          if (!["A", "B", "C", "D"].includes(question.answer)) {
            return false;
          }
        }

        return true;
      })
      .map((q) => this.normalizeQuestions([q])[0])
      .filter((q): q is QuizQuestion => q !== undefined); // Filter out undefined results
  }

  private handleGenerationError(error: any): Error {
    const errorMessage = error?.message || "";

    // OpenAI Quota/Rate Limit Errors
    if (
      errorMessage.includes("exceeded your current quota") ||
      errorMessage.includes("check your plan and billing details") ||
      error?.status === 429 ||
      error?.code === "rate_limit_exceeded"
    ) {
      console.error("OpenAI quota exceeded:", error);
      return new Error(
        "OpenAI API quota exceeded. Please try again later or contact support."
      );
    }

    // Configuration Errors: require OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is required");
      return new Error(
        "Service configuration error. Please contact the administrator."
      );
    }

    // Parse Errors
    if (errorMessage.includes("parse") || errorMessage.includes("JSON")) {
      console.error("AI response parsing error:", error);
      return new Error(
        "Failed to generate valid quiz questions. Please try again."
      );
    }

    // Log unexpected errors
    console.error("Unexpected quiz generation error:", {
      message: errorMessage,
      status: error?.status,
      code: error?.code,
      error,
    });

    return new Error("Failed to generate quiz. Please try again later.");
  }
}
