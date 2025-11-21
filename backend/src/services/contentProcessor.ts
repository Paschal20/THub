// services/ContentProcessor.ts
import dotenv from "dotenv";
dotenv.config();

export class ContentProcessor {
  async processContent(content: string): Promise<string> {
    // Remove extra whitespace
    let processed = content.replace(/\s+/g, " ").trim();

    // Limit content length to avoid token limits
    if (processed.length > 10000) {
      processed = processed.substring(0, 10000) + "...";
    }

    return processed;
  }
}

// services/CacheService.ts
export class CacheService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiry });

    // Cleanup expired items periodically
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// services/ValidationService.ts
export class ValidationService {
  async validateQuestions(questions: any[]): Promise<any[]> {
    return questions.map((q, index) => {
      if (!q.question || q.question.trim().length === 0) {
        throw new Error(`Question ${index + 1} has empty question text`);
      }

      if (!this.isValidQuestionType(q.type)) {
        throw new Error(`Question ${index + 1} has invalid type: ${q.type}`);
      }

      if (!q.answer) {
        throw new Error(`Question ${index + 1} has no answer`);
      }

      return q;
    });
  }

  private isValidQuestionType(type: string): boolean {
    return ["multiple-choice", "true-false", "fill-in-the-blank"].includes(
      type
    );
  }
}
