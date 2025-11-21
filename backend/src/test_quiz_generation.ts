import dotenv from "dotenv";
dotenv.config();

import { QuizGenerationService } from "./services/QuizGenerationService";

async function main() {
  const service = new QuizGenerationService();
  const options = {
    topic: "Photosynthesis",
    difficulty: "easy" as "easy",
    numQuestions: 2,
    questionTypes: ["multiple-choice", "true-false"],
    userId: "test-user",
  };
  try {
    const result = await service.generateQuiz(options as any);
    console.log("Generated quiz questions:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Quiz generation failed:", err);
  }
}

main();
