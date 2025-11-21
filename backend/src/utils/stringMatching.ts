/**
 * Utility functions for fuzzy string matching and answer validation
 */

/**
 * Calculates the Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns The edit distance between the strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
    Array.from({ length: str1.length + 1 }, () => 0)
  );

  for (let i = 0; i <= str1.length; i++) {
    matrix[0]![i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j]![0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      const deletion = matrix[j]![i - 1]! + 1;
      const insertion = matrix[j - 1]![i]! + 1;
      const substitution = matrix[j - 1]![i - 1]! + indicator;
      matrix[j]![i] = Math.min(deletion, insertion, substitution);
    }
  }

  return matrix[str2.length]![str1.length]!;
}

/**
 * Checks if two strings are similar based on fuzzy matching
 * @param userAnswer User's answer
 * @param correctAnswer Correct answer
 * @param threshold Similarity threshold (0-1, where 1 is exact match)
 * @returns True if strings are similar enough
 */
export function isAnswerSimilar(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.8
): boolean {
  // Normalize strings: trim, lowercase, remove extra spaces
  const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedCorrect = correctAnswer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // For short answers, allow small differences
  if (normalizedCorrect.length <= 3) {
    return levenshteinDistance(normalizedUser, normalizedCorrect) <= 1;
  }

  // Calculate similarity ratio
  const maxLength = Math.max(normalizedUser.length, normalizedCorrect.length);
  if (maxLength === 0) return true;

  const distance = levenshteinDistance(normalizedUser, normalizedCorrect);
  const similarity = 1 - distance / maxLength;

  return similarity >= threshold;
}

/**
 * Validates a fill-in-the-blank answer with fuzzy matching
 * @param userAnswer User's input
 * @param correctAnswer The correct answer
 * @returns Object with isCorrect boolean and similarity score
 */
export function validateFillInBlankAnswer(
  userAnswer: string,
  correctAnswer: string
) {
  const isCorrect = isAnswerSimilar(userAnswer, correctAnswer);
  const distance = levenshteinDistance(
    userAnswer.trim().toLowerCase(),
    correctAnswer.trim().toLowerCase()
  );
  const maxLength = Math.max(userAnswer.length, correctAnswer.length);
  const similarity = maxLength === 0 ? 1 : 1 - distance / maxLength;

  return {
    isCorrect,
    similarity: Math.round(similarity * 100) / 100,
    distance,
  };
}
