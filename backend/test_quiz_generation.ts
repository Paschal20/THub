import { QuizGenerationService } from "./src/services/QuizGenerationService";

async function main() {
  // Set mock mode to avoid API calls
  process.env.MOCK_AI = "true";

  const service = new QuizGenerationService();

  // Test math topic
  const mathOptions = {
    topic: "Basic Arithmetic",
    difficulty: "easy" as "easy",
    numQuestions: 5,
    questionTypes: ["multiple-choice"],
    userId: "test-user",
  };

  console.log("Testing math topic generation:");
  try {
    const mathResult = await service.generateQuiz(mathOptions);
    console.log("Math quiz questions:", JSON.stringify(mathResult.questions, null, 2));
  } catch (err) {
    console.error("Math quiz generation failed:", err);
  }

  // Test fill-in-the-blank
  const fillBlankOptions = {
    topic: "Basic Arithmetic",
    difficulty: "easy" as "easy",
    numQuestions: 3,
    questionTypes: ["fill-in-the-blank"],
    userId: "test-user",
  };

  console.log("\nTesting fill-in-the-blank generation:");
  try {
    const fillBlankResult = await service.generateQuiz(fillBlankOptions);
    console.log("Fill-in-the-blank questions:", JSON.stringify(fillBlankResult.questions, null, 2));

    // Validate that all questions have proper options
    let validationErrors: string[] = [];
    fillBlankResult.questions.forEach((q, index) => {
      if (!q.options || typeof q.options !== 'object') {
        validationErrors.push(`Question ${index}: Missing options object`);
      } else {
        const { A, B, C, D } = q.options;
        if (!A || !B || !C || !D) {
          validationErrors.push(`Question ${index}: Missing option values (A: "${A}", B: "${B}", C: "${C}", D: "${D}")`);
        }
        if (!["A", "B", "C", "D"].includes(q.answer)) {
          validationErrors.push(`Question ${index}: Invalid answer "${q.answer}" (should be A, B, C, or D)`);
        }
      }
    });

    if (validationErrors.length === 0) {
      console.log("✅ All fill-in-the-blank questions passed validation");
    } else {
      console.log("❌ Validation errors found:");
      validationErrors.forEach(error => console.log(`  - ${error}`));
    }
  } catch (err) {
    console.error("Fill-in-the-blank generation failed:", err);
  }
}

main();
