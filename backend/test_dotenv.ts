import "dotenv/config";

console.log("Testing dotenv configuration:");
console.log("PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGODB_URL:", process.env.MONGODB_URL ? "Set" : "Not set");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Set" : "Not set");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Set" : "Not set");
console.log("MOCK_AI:", process.env.MOCK_AI);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Set" : "Not set");
console.log(
  "CLOUDINARY_CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not set"
);
console.log("UPLOAD_DIR:", process.env.UPLOAD_DIR);
