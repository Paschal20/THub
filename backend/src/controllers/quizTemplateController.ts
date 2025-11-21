import { Response } from "express";
import QuizTemplate, { IQuizTemplate } from "../models/QuizTemplate";
import { AuthRequest } from "../middleware/authMiddleware";

// Helper to safely extract message from unknown errors
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}

export class QuizTemplateController {
  // Create a new quiz template
  createTemplate = async (req: AuthRequest, res: Response) => {
    try {
      const {
        title,
        description,
        topic,
        difficulty,
        numQuestions,
        questionTypes,
        tags,
        category,
        isPublic = false,
      } = req.body;

      // Validate required fields
      if (!title || !description || !topic || !difficulty || !numQuestions || !questionTypes || !category) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      // Validate question types
      const validTypes = ["multiple-choice", "true-false", "fill-in-the-blank"];
      if (!Array.isArray(questionTypes) || !questionTypes.every(type => validTypes.includes(type))) {
        return res.status(400).json({
          success: false,
          error: "Invalid question types",
        });
      }

      const template = new QuizTemplate({
        title,
        description,
        topic,
        difficulty,
        numQuestions,
        questionTypes,
        tags: tags || [],
        category,
        isPublic,
        userId: req.user!.id,
        status: isPublic ? "published" : "draft",
      });

      await template.save();

      res.json({
        success: true,
        data: template,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Create template error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to create template",
      });
    }
  };

  // Get all templates for the user
  getUserTemplates = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { status, isPublic } = req.query;

      const query: any = { userId };

      if (status) query.status = status;
      if (isPublic !== undefined) query.isPublic = isPublic === "true";

      const templates = await QuizTemplate.find(query).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get user templates error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get templates",
      });
    }
  };

  // Get public templates (for browsing)
  getPublicTemplates = async (req: AuthRequest, res: Response) => {
    try {
      const {
        category,
        difficulty,
        tags,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const query: any = {
        isPublic: true,
        status: "published"
      };

      if (category) query.category = category;
      if (difficulty) query.difficulty = difficulty;
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagArray };
      }

      let templates;
      if (search) {
        // Use text search
        templates = await QuizTemplate.find(
          { ...query, $text: { $search: search as string } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" }, usageCount: -1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit));
      } else {
        templates = await QuizTemplate.find(query)
          .sort({ usageCount: -1, rating: -1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit));
      }

      const total = await QuizTemplate.countDocuments(query);

      res.json({
        success: true,
        data: templates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get public templates error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get templates",
      });
    }
  };

  // Get a specific template by ID
  getTemplateById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const template = await QuizTemplate.findOne({
        _id: id,
        $or: [
          { userId }, // User's own template
          { isPublic: true, status: "published" } // Public template
        ]
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template not found",
        });
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get template by ID error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get template",
      });
    }
  };

  // Update a template
  updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      // Remove fields that shouldn't be updated directly
      delete updates._id;
      delete updates.userId;
      delete updates.createdAt;
      delete updates.usageCount;
      delete updates.rating;
      delete updates.totalRatings;

      const template = await QuizTemplate.findOneAndUpdate(
        { _id: id, userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template not found or access denied",
        });
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Update template error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to update template",
      });
    }
  };

  // Delete a template
  deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const template = await QuizTemplate.findOneAndDelete({
        _id: id,
        userId,
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          error: "Template not found or access denied",
        });
      }

      res.json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Delete template error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to delete template",
      });
    }
  };

  // Rate a template
  rateTemplate = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: "Rating must be between 1 and 5",
        });
      }

      const template = await QuizTemplate.findById(id);
      if (!template || !template.isPublic || template.status !== "published") {
        return res.status(404).json({
          success: false,
          error: "Template not found or not available for rating",
        });
      }

      await template.addRating(rating);

      res.json({
        success: true,
        data: {
          averageRating: template.averageRating,
          totalRatings: template.totalRatings,
        },
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Rate template error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to rate template",
      });
    }
  };

  // Use a template (increment usage count)
  useTemplate = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const template = await QuizTemplate.findById(id);
      if (!template || !template.isPublic || template.status !== "published") {
        return res.status(404).json({
          success: false,
          error: "Template not found or not available",
        });
      }

      await template.incrementUsage();

      res.json({
        success: true,
        data: template,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Use template error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to use template",
      });
    }
  };

  // Get popular templates
  getPopularTemplates = async (req: AuthRequest, res: Response) => {
    try {
      const { category, difficulty, limit = 10 } = req.query;

      const templates = await QuizTemplate.findPopular(
        Number(limit),
        category as string,
        difficulty as string
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get popular templates error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get popular templates",
      });
    }
  };
}

// Create controller instance
const quizTemplateController = new QuizTemplateController();

// Export methods for routing
export const createTemplate = quizTemplateController.createTemplate.bind(quizTemplateController);
export const getUserTemplates = quizTemplateController.getUserTemplates.bind(quizTemplateController);
export const getPublicTemplates = quizTemplateController.getPublicTemplates.bind(quizTemplateController);
export const getTemplateById = quizTemplateController.getTemplateById.bind(quizTemplateController);
export const updateTemplate = quizTemplateController.updateTemplate.bind(quizTemplateController);
export const deleteTemplate = quizTemplateController.deleteTemplate.bind(quizTemplateController);
export const rateTemplate = quizTemplateController.rateTemplate.bind(quizTemplateController);
export const useTemplate = quizTemplateController.useTemplate.bind(quizTemplateController);
export const getPopularTemplates = quizTemplateController.getPopularTemplates.bind(quizTemplateController);