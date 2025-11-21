import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import databaseOptimizationService, { DatabaseStats, QueryOptimization } from "../services/databaseOptimizationService";

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

export class DatabaseController {
  /**
   * Get database statistics and health metrics
   */
  getDatabaseStats = async (req: AuthRequest, res: Response) => {
    try {
      const stats: DatabaseStats = await databaseOptimizationService.getDatabaseStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get database stats error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get database stats",
      });
    }
  };

  /**
   * Get query optimization suggestions
   */
  getQueryOptimizations = async (req: AuthRequest, res: Response) => {
    try {
      const optimizations: QueryOptimization[] = await databaseOptimizationService.analyzeQueryOptimizations();

      res.json({
        success: true,
        data: optimizations,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get query optimizations error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get query optimizations",
      });
    }
  };

  /**
   * Get slow query metrics
   */
  getSlowQueries = async (req: AuthRequest, res: Response) => {
    try {
      const slowQueries = await databaseOptimizationService.getQueryMetrics();

      res.json({
        success: true,
        data: slowQueries,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get slow queries error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get slow queries",
      });
    }
  };

  /**
   * Get cache statistics
   */
  getCacheStats = async (req: AuthRequest, res: Response) => {
    try {
      const cacheStats = databaseOptimizationService.getCacheStats();

      res.json({
        success: true,
        data: cacheStats,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Get cache stats error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to get cache stats",
      });
    }
  };

  /**
   * Clear query cache
   */
  clearCache = async (req: AuthRequest, res: Response) => {
    try {
      databaseOptimizationService.clearCache();

      res.json({
        success: true,
        message: "Cache cleared successfully",
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Clear cache error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to clear cache",
      });
    }
  };

  /**
   * Perform database maintenance
   */
  performMaintenance = async (req: AuthRequest, res: Response) => {
    try {
      await databaseOptimizationService.performMaintenance();

      res.json({
        success: true,
        message: "Database maintenance completed successfully",
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Database maintenance error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to perform database maintenance",
      });
    }
  };

  /**
   * Enable query profiling
   */
  enableQueryProfiling = async (req: AuthRequest, res: Response) => {
    try {
      await databaseOptimizationService.enableQueryProfiling();

      res.json({
        success: true,
        message: "Query profiling enabled successfully",
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Enable query profiling error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Failed to enable query profiling",
      });
    }
  };

  /**
   * Get database health check
   */
  getHealthCheck = async (req: AuthRequest, res: Response) => {
    try {
      const mongoose = require('mongoose');
      const db = mongoose.connection;

      const healthData = {
        status: db.readyState === 1 ? 'healthy' : 'unhealthy',
        readyState: db.readyState,
        name: db.name,
        host: db.host,
        port: db.port,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cacheStats: databaseOptimizationService.getCacheStats(),
      };

      const statusCode = healthData.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthData.status === 'healthy',
        data: healthData,
      });
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
      console.error("Health check error:", error);
      res.status(500).json({
        success: false,
        error: msg || "Health check failed",
      });
    }
  };
}

// Create controller instance
const databaseController = new DatabaseController();

// Export methods for routing
export const getDatabaseStats = databaseController.getDatabaseStats.bind(databaseController);
export const getQueryOptimizations = databaseController.getQueryOptimizations.bind(databaseController);
export const getSlowQueries = databaseController.getSlowQueries.bind(databaseController);
export const getCacheStats = databaseController.getCacheStats.bind(databaseController);
export const clearCache = databaseController.clearCache.bind(databaseController);
export const performMaintenance = databaseController.performMaintenance.bind(databaseController);
export const enableQueryProfiling = databaseController.enableQueryProfiling.bind(databaseController);
export const getHealthCheck = databaseController.getHealthCheck.bind(databaseController);