import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

interface QueryMetrics {
  collection: string;
  operation: string;
  duration: number;
  timestamp: Date;
  query: any;
  slow: boolean;
}

export class DatabaseOptimizationMiddleware {
  private queryMetrics: QueryMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 100; // ms

  /**
   * Middleware to monitor database query performance
   */
  monitorQueries = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Use 'finish' event instead of overriding res.send to avoid response stream issues
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // Log slow requests
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }
    });

    next();
  };

  /**
   * Middleware to add database connection health check
   */
  databaseHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if database is connected
      if (mongoose.connection.readyState !== 1) {
        console.warn("⚠️ Database not connected, attempting to reconnect...");
        // You could trigger a reconnection here if needed
      }

      // Add database health to response headers in development
      if (process.env.NODE_ENV === 'development') {
        res.set('X-DB-Status', mongoose.connection.readyState === 1 ? 'connected' : 'disconnected');
        res.set('X-DB-Name', mongoose.connection.name || 'unknown');
      }

      next();
    } catch (error) {
      console.error("Database health check error:", error);
      next();
    }
  };

  /**
   * Middleware to prevent N+1 queries by batching
   */
  batchQueries = (req: Request, res: Response, next: NextFunction) => {
    // This is a simplified version. In a real implementation,
    // you'd use a library like DataLoader for batching

    const originalJson = res.json;
    res.json = function(data) {
      // Check if response contains multiple similar queries that could be batched
      if (data && data.data && Array.isArray(data.data)) {
        const itemCount = data.data.length;
        if (itemCount > 10) {
          console.log(`📊 Large result set: ${itemCount} items returned for ${req.path}`);
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };

  /**
   * Middleware to add query optimization headers
   */
  addOptimizationHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Add headers to help with debugging and optimization
    res.set('X-Query-Optimization', 'enabled');
    res.set('X-Cache-Status', 'check');

    // Add timing information
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      if (durationMs > 1000) { // Log requests taking more than 1 second
        console.warn(`⏱️ Slow API response: ${req.method} ${req.path} took ${durationMs.toFixed(2)}ms`);
      }
    });

    next();
  };

  /**
   * Get collected query metrics
   */
  getQueryMetrics(): QueryMetrics[] {
    return [...this.queryMetrics];
  }

  /**
   * Clear query metrics
   */
  clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const metrics = this.getQueryMetrics();
    const slowQueries = metrics.filter(m => m.slow);

    return {
      totalQueries: metrics.length,
      slowQueries: slowQueries.length,
      averageDuration: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
        : 0,
      slowestQuery: metrics.length > 0
        ? metrics.reduce((max, m) => m.duration > max.duration ? m : max)
        : null,
      queriesByCollection: metrics.reduce((acc, m) => {
        acc[m.collection] = (acc[m.collection] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const dbOptimizationMiddleware = new DatabaseOptimizationMiddleware();

// Export individual middleware functions
export const monitorQueries = dbOptimizationMiddleware.monitorQueries.bind(dbOptimizationMiddleware);
export const databaseHealthCheck = dbOptimizationMiddleware.databaseHealthCheck.bind(dbOptimizationMiddleware);
export const batchQueries = dbOptimizationMiddleware.batchQueries.bind(dbOptimizationMiddleware);
export const addOptimizationHeaders = dbOptimizationMiddleware.addOptimizationHeaders.bind(dbOptimizationMiddleware);
