// Import Express framework for creating the router
import express from "express";
// Import database controller functions
import {
  getDatabaseStats,
  getQueryOptimizations,
  getSlowQueries,
  getCacheStats,
  clearCache,
  performMaintenance,
  enableQueryProfiling,
  getHealthCheck,
} from "../controllers/databaseController";
// Import authentication middleware
import { protect } from "../middleware/authMiddleware";

// Create a new Express router instance
const router = express.Router();

// All routes require authentication and admin privileges (you might want to add admin middleware)
router.use(protect);

// Database monitoring routes
router.get("/stats", getDatabaseStats);
router.get("/optimizations", getQueryOptimizations);
router.get("/slow-queries", getSlowQueries);
router.get("/cache", getCacheStats);
router.delete("/cache", clearCache);
router.post("/maintenance", performMaintenance);
router.post("/profiling", enableQueryProfiling);
router.get("/health", getHealthCheck);

// Export the router
export default router;