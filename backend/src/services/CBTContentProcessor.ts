export class CBTValidationService {
  validateQuestion(question: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!question.question || typeof question.question !== "string") {
      errors.push("Question text is required and must be a string");
    }

    if (!question.type || !["multiple-choice", "true-false", "fill-in-the-blank"].includes(question.type)) {
      errors.push("Question type must be one of: multiple-choice, true-false, fill-in-the-blank");
    }

    if (!question.difficulty || !["easy", "medium", "hard"].includes(question.difficulty)) {
      errors.push("Question difficulty must be one of: easy, medium, hard");
    }

    if (!question.answer) {
      errors.push("Question answer is required");
    }

    if (!question.explanation || typeof question.explanation !== "string") {
      errors.push("Question explanation is required and must be a string");
    }

    // Type-specific validations
    if (question.type === "multiple-choice") {
      if (!question.options || typeof question.options !== "object") {
        errors.push("Multiple choice questions must have options object");
      } else {
        const requiredOptions = ["A", "B", "C", "D"];
        for (const option of requiredOptions) {
          if (!question.options[option]) {
            errors.push(`Multiple choice questions must have option ${option}`);
          }
        }
      }
    } else if (question.type === "true-false") {
      if (!question.options || !question.options.A || !question.options.B) {
        errors.push("True-false questions must have at least options A and B");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateQuiz(quiz: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!quiz.title || typeof quiz.title !== "string") {
      errors.push("Quiz title is required and must be a string");
    }

    if (!quiz.topic || typeof quiz.topic !== "string") {
      errors.push("Quiz topic is required and must be a string");
    }

    if (!quiz.difficulty || !["easy", "medium", "hard"].includes(quiz.difficulty)) {
      errors.push("Quiz difficulty must be one of: easy, medium, hard");
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      errors.push("Quiz must have at least one question");
    } else {
      quiz.questions.forEach((question: any, index: number) => {
        const questionValidation = this.validateQuestion(question);
        if (!questionValidation.isValid) {
          errors.push(`Question ${index + 1}: ${questionValidation.errors.join(", ")}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  sanitizeContent(content: string): string {
    // Remove potentially harmful content and normalize
    return content
      .replace(/[<>]/g, "") // Remove angle brackets
      .trim()
      .substring(0, 10000); // Limit content length
  }

  extractTopics(content: string): string[] {
    // Simple topic extraction - in production, this would use NLP
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
      "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
      "did", "will", "would", "could", "should", "may", "might", "must", "can", "shall"
    ]);

    const topics: string[] = [];
    const wordCount: { [key: string]: number } = {};

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, "");
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });

    // Return top 5 most frequent words as topics
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  determineDifficulty(content: string): "easy" | "medium" | "hard" {
    const words = content.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Simple heuristic: longer words = harder content
    if (avgWordLength > 7) return "hard";
    if (avgWordLength > 5) return "medium";
    return "easy";
  }

  estimateReadingTime(content: string): number {
    // Average reading speed: 200 words per minute
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 200);
  }
}