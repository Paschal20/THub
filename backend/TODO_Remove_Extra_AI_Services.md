# TODO: Remove Extra AI Services and Keep Only OpenAI

## Tasks

- [ ] Update QuizGenerationOptions interface: change forceProvider to only "openai"
- [ ] Modify selectProvider method to only check for OpenAI API key
- [ ] Remove generateWithDeepSeek, generateWithHuggingFace, generateWithCohere, generateWithGemini methods
- [ ] Update generateQuiz switch statement to only handle "openai" case
- [ ] Update error handling in handleGenerationError to only mention OpenAI
- [ ] Remove import for gemini.ts and delete the file if not used elsewhere
- [ ] Test the updated service to ensure OpenAI works correctly
- [ ] Update any documentation or comments referencing other providers

## Notes

- Keep axios import as it may be used elsewhere
- Ensure mock mode still works
- Verify that the service falls back to mock if OpenAI fails
