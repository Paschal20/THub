import { v4 as uuidv4 } from "uuid";
import { cbtPresetQuestions } from "../data/cbtPresetQuestions";
import { ICBTQuestion } from "../models/CBTQuiz";

export interface CBTQuizGenerationOptions {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  numQuestions: number;
  questionTypes: string[];
  content?: string;
  userId: string;
}

export interface CBTQuizGenerationResult {
  questions: ICBTQuestion[];
}

export class CBTQuizGenerationService {
  async generateCBTQuiz(options: CBTQuizGenerationOptions): Promise<CBTQuizGenerationResult> {
    const { topic, difficulty, numQuestions, questionTypes } = options;
    try {
      const questions = this.selectPresetQuestions({
        topic,
        difficulty,
        numQuestions,
        questionTypes,
      });

      return { questions };
    } catch (error) {
      console.error("Error generating CBT quiz:", error);
      throw new Error("Failed to generate CBT quiz");
    }
  }

  private selectPresetQuestions({
    topic,
    difficulty,
    numQuestions,
    questionTypes,
  }: {
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    numQuestions: number;
    questionTypes: string[];
  }): ICBTQuestion[] {
    const normalizedTopic = topic.trim().toLowerCase();
    const normalizedTypes = (questionTypes.length ? questionTypes : ["multiple-choice"]).map((type) =>
      type.toLowerCase()
    );

    const topicMatches = cbtPresetQuestions.filter((question) =>
      question.tags.some((tag) => tag.toLowerCase().includes(normalizedTopic))
    );

    const difficultyMatches = (topicMatches.length ? topicMatches : cbtPresetQuestions).filter(
      (question) => question.difficulty === difficulty
    );

    const typeFiltered = difficultyMatches.filter((question) =>
      normalizedTypes.includes(question.type.toLowerCase())
    );

    const pool = typeFiltered.length ? typeFiltered : difficultyMatches.length ? difficultyMatches : cbtPresetQuestions;

    if (!pool.length) {
      throw new Error("No preset CBT questions available for the requested configuration.");
    }

    const randomizedQuestions: ICBTQuestion[] = [];
    const workingPool = [...pool];

    while (randomizedQuestions.length < numQuestions) {
      if (!workingPool.length) {
        workingPool.push(...pool);
      }

      const randomIndex = Math.floor(Math.random() * workingPool.length);
      const [selectedQuestion] = workingPool.splice(randomIndex, 1);

      if (!selectedQuestion) {
        continue;
      }

      const randomizedQuestion: ICBTQuestion = {
        ...selectedQuestion,
        _id: uuidv4(),
      };

      randomizedQuestions.push(randomizedQuestion);
    }

    return randomizedQuestions;
  }
}