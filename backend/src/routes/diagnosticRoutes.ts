// src/routes/diagnosticRoutes.ts
import { Router } from "express";
import { DiagnosticController } from "../controllers/diagnosticController";
import { protect } from "../middleware/authMiddleware";

const router = Router();
const diagnosticController = new DiagnosticController();

// Secure diagnostic endpoint with auth middleware
router.get(
  "/test-providers",
  protect,
  diagnosticController.testProviders
);

export default router;
