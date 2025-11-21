import { isAnswerSimilar, validateFillInBlankAnswer } from '../../utils/stringMatching';

describe('String Matching Utils', () => {
  describe('isAnswerSimilar', () => {
    it('should return true for exact matches', () => {
      expect(isAnswerSimilar('hello', 'hello')).toBe(true);
    });

    it('should return true for similar strings within threshold', () => {
      expect(isAnswerSimilar('hello', 'helo')).toBe(true);
    });

    it('should return false for dissimilar strings', () => {
      expect(isAnswerSimilar('hello', 'world')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isAnswerSimilar('Hello', 'hello')).toBe(true);
    });

    it('should handle extra spaces', () => {
      expect(isAnswerSimilar('hello world', '  hello   world  ')).toBe(true);
    });
  });

  describe('validateFillInBlankAnswer', () => {
    it('should return correct validation result', () => {
      const result = validateFillInBlankAnswer('hello', 'hello');
      expect(result.isCorrect).toBe(true);
      expect(result.similarity).toBe(1);
      expect(result.distance).toBe(0);
    });
  });
});