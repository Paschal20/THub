// src/controllers/diagnosticController.ts
import { Request, Response } from "express";
import { QuizGenerationService } from "../services/QuizGenerationService";

export class DiagnosticController {
  private quizService: QuizGenerationService;

  constructor() {
    this.quizService = new QuizGenerationService();
  }

  testProviders = async (req: Request, res: Response): Promise<void> => {
    const results: { [key: string]: any } = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    try {
      // Test minimal quiz generation
      const testOptions = {
        topic: "test",
        difficulty: "easy" as const,
        numQuestions: 1,
        questionTypes: ["multiple_choice"],
        userId: "diagnostic-test",
      };

       // Test OpenAI provider
       const testResult: {
         provider: string;
         startTime: number;
         status: string;
         responseTime?: number;
         modelUsed?: string;
         questions?: number;
         error?: string;
       } = {
         provider: "openai",
         startTime: Date.now(),
         status: "pending",
       };

       try {
         const quizResult = await this.quizService.generateQuiz(testOptions);

          testResult.status = "success";
          testResult.responseTime = Date.now() - testResult.startTime;
          testResult.modelUsed = quizResult.metadata.modelUsed;
          testResult.questions = quizResult.questions.length;
       } catch (error: any) {
         testResult.status = "error";
         testResult.error = error.message;
       }

       results.tests.push(testResult);

       // Add configuration status
       results.configuration = {
         openaiConfigured: !!process.env.OPENAI_API_KEY,
       };

      res.json(results);
    } catch (error: any) {
      res.status(500).json({
        error: "Diagnostic test failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };
}
