export function validateFillInBlankAnswer(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) return false;

  // Normalize both answers
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Exact match
  if (normalizedUser === normalizedCorrect) return true;

  // Check for common variations and typos
  return areAnswersSimilar(normalizedUser, normalizedCorrect);
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove punctuation except for hyphens and apostrophes
    .replace(/[^\w\s\-']/g, '')
    // Normalize common abbreviations
    .replace(/\b(dr|mr|mrs|ms|prof|sr|jr)\./g, '$1')
    // Remove articles (a, an, the) at the beginning
    .replace(/^(a|an|the)\s+/i, '')
    .trim();
}

function areAnswersSimilar(answer1: string, answer2: string): boolean {
  // Simple Levenshtein distance check
  const distance = levenshteinDistance(answer1, answer2);
  const maxLength = Math.max(answer1.length, answer2.length);

  // Allow up to 20% difference for short answers, 10% for longer ones
  const threshold = maxLength < 10 ? 0.2 : 0.1;

  return distance / maxLength <= threshold;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1,     // insertion
          matrix[i - 1]![j]! + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length]![str1.length]!;
}

export function calculateAnswerSimilarity(answer1: string, answer2: string): number {
  const distance = levenshteinDistance(
    normalizeAnswer(answer1),
    normalizeAnswer(answer2)
  );
  const maxLength = Math.max(answer1.length, answer2.length);

  if (maxLength === 0) return 1;

  return 1 - (distance / maxLength);
}

export function extractKeywords(text: string): string[] {
  // Simple keyword extraction - split by spaces and filter common words
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
  ]);

  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}