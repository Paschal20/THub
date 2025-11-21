// Import Express framework for creating the router
import express from "express";
// Import quiz template controller functions
import {
  createTemplate,
  getUserTemplates,
  getPublicTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  rateTemplate,
  useTemplate,
  getPopularTemplates,
} from "../controllers/quizTemplateController";
// Import authentication middleware
import { protect } from "../middleware/authMiddleware";

// Create a new Express router instance
const router = express.Router();

// All routes require authentication
router.use(protect);

// Create a new template
router.post("/", createTemplate);

// Get user's own templates
router.get("/my", getUserTemplates);

// Get public templates (browsing)
router.get("/public", getPublicTemplates);

// Get popular templates
router.get("/popular", getPopularTemplates);

// Get a specific template by ID
router.get("/:id", getTemplateById);

// Update a template
router.put("/:id", updateTemplate);

// Delete a template
router.delete("/:id", deleteTemplate);

// Rate a template
router.post("/:id/rate", rateTemplate);

// Use a template (increment usage count)
router.post("/:id/use", useTemplate);

// Export the router
export default router;