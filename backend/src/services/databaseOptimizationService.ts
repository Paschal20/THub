import mongoose from "mongoose";
import QuizResult from "../models/QuizResult";
import Quiz from "../models/Quiz";
import QuizTemplate from "../models/QuizTemplate";

export interface DatabaseStats {
  collections: {
    name: string;
    documentCount: number;
    indexCount: number;
    size: number;
  }[];
  indexes: any[];
  slowQueries: any[];
  connectionPool: {
    size: number;
    available: number;
    pending: number;
    borrowed: number;
  };
}

export interface QueryOptimization {
  collection: string;
  operation: string;
  optimization: string;
  impact: 'high' | 'medium' | 'low';
}

export class DatabaseOptimizationService {
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get comprehensive database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database not connected");

      // Get collection stats
      const collections = await db.listCollections().toArray();
      const collectionStats = await Promise.all(
        collections.map(async (collection) => {
          const stats = await db.command({ collStats: collection.name });
          return {
            name: collection.name,
            documentCount: stats.count || 0,
            indexCount: Object.keys(stats.indexDetails || {}).length,
            size: stats.size || 0,
          };
        })
      );

      // Get index information
      const indexes = await db.collection('system.indexes').find({}).toArray();

      // Get connection pool stats
      const poolStats = {
        size: 5, // Default pool size
        available: 0, // Would need MongoDB driver access
        pending: 0,
        borrowed: 0,
      };

      return {
        collections: collectionStats,
        indexes,
        slowQueries: [], // Would need MongoDB profiler
        connectionPool: poolStats,
      };
    } catch (error) {
      console.error("Error getting database stats:", error);
      throw error;
    }
  }

  /**
   * Analyze and suggest query optimizations
   */
  async analyzeQueryOptimizations(): Promise<QueryOptimization[]> {
    const optimizations: QueryOptimization[] = [];

    try {
      // Check for missing indexes on common queries
      const quizResultQueries = [
        { userId: "user123", status: "completed" },
        { quizId: "quiz123", score: { $gt: 5 } },
        { userId: "user123", completedAt: { $gte: new Date() } }
      ];

      for (const query of quizResultQueries) {
        const explanation = await QuizResult.find(query).explain('executionStats') as any;
        if (explanation.executionStats.totalDocsExamined > explanation.executionStats.totalDocsReturned * 10) {
          optimizations.push({
            collection: 'quizresults',
            operation: 'find',
            optimization: `Add compound index for query: ${JSON.stringify(query)}`,
            impact: 'high'
          });
        }
      }

      // Check aggregation pipeline performance
      const aggregationPipeline = [
        { $match: { status: "completed" } },
        { $group: { _id: "$quizId", avgScore: { $avg: "$score" } } }
      ];

      const aggExplanation = await QuizResult.aggregate(aggregationPipeline).explain('executionStats');
      if (aggExplanation.stages && aggExplanation.stages[0].$cursor?.executionStats?.totalDocsExamined > 1000) {
        optimizations.push({
          collection: 'quizresults',
          operation: 'aggregate',
          optimization: 'Consider adding indexes on aggregation group fields',
          impact: 'medium'
        });
      }

      // Check for inefficient $lookup operations
      optimizations.push({
        collection: 'quizresults',
        operation: '$lookup',
        optimization: 'Consider embedding frequently accessed data or using application-level joins',
        impact: 'medium'
      });

    } catch (error) {
      console.error("Error analyzing query optimizations:", error);
    }

    return optimizations;
  }

  /**
   * Cache frequently accessed data
   */
  async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.queryCache.set(key, { data, timestamp: now, ttl });
    return data;
  }

  /**
   * Optimized user analytics query with caching
   */
  async getUserAnalyticsCached(userId: string) {
    const cacheKey = `user_analytics_${userId}`;

    return this.getCachedData(cacheKey, async () => {
      const results = await QuizResult.find({
        userId,
        status: "completed"
      }).sort({ completedAt: -1 }).limit(50);

      // Calculate analytics
      const totalQuizzes = results.length;
      const averageScore = totalQuizzes > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / totalQuizzes
        : 0;

      return {
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        recentResults: results.slice(0, 10).map(r => ({
          quizId: r.quizId,
          score: r.score,
          completedAt: r.completedAt
        }))
      };
    }, 10 * 60 * 1000); // 10 minute cache
  }

  /**
   * Optimized quiz search with text indexes
   */
  async searchQuizzes(query: string, filters: any = {}, limit: number = 20) {
    const searchQuery: any = {
      $text: { $search: query },
      status: "published"
    };

    // Add filters
    if (filters.category) searchQuery.category = filters.category;
    if (filters.difficulty) searchQuery.difficulty = filters.difficulty;
    if (filters.isPublic !== undefined) searchQuery.isPublic = filters.isPublic;

    return Quiz.find(searchQuery, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" }, "metadata.averageScore": -1 })
      .limit(limit)
      .select('title topic difficulty category metadata.averageScore metadata.totalAttempts');
  }

  /**
   * Bulk operations for better performance
   */
  async bulkUpdateQuizStats(quizId: string) {
    const bulkOps = [];

    // Get all results for this quiz
    const results = await QuizResult.find({ quizId, status: "completed" });

    if (results.length === 0) return;

    const totalAttempts = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalAttempts;
    const averageTime = results.reduce((sum, r) => sum + r.timeTaken, 0) / totalAttempts;

    bulkOps.push({
      updateOne: {
        filter: { _id: quizId },
        update: {
          $set: {
            "metadata.totalAttempts": totalAttempts,
            "metadata.averageScore": Math.round(averageScore * 100) / 100,
            "metadata.averageTime": Math.round(averageTime)
          }
        }
      }
    });

    if (bulkOps.length > 0) {
      await Quiz.bulkWrite(bulkOps);
    }
  }

  /**
   * Database maintenance operations
   */
  async performMaintenance() {
    try {
      const db = mongoose.connection.db;
      if (!db) return;

      // Clean up old sessions (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.collection('quizsessions').deleteMany({
        lastActivityAt: { $lt: oneDayAgo },
        status: { $in: ['expired', 'abandoned'] }
      });

      // Update quiz statistics for popular quizzes
      const popularQuizzes = await Quiz.find({
        "metadata.totalAttempts": { $gt: 10 }
      }).limit(50);

      for (const quiz of popularQuizzes) {
        await this.bulkUpdateQuizStats(quiz._id);
      }

      console.log("✅ Database maintenance completed");
    } catch (error) {
      console.error("❌ Database maintenance failed:", error);
    }
  }

  /**
   * Monitor slow queries (would need MongoDB profiler enabled)
   */
  async enableQueryProfiling() {
    try {
      const db = mongoose.connection.db;
      if (!db) return;

      // Enable profiling for slow queries (>100ms)
      await db.command({ profile: 2, slowms: 100 });

      console.log("✅ Query profiling enabled");
    } catch (error) {
      console.error("❌ Failed to enable query profiling:", error);
    }
  }

  /**
   * Get query performance metrics
   */
  async getQueryMetrics() {
    try {
      const db = mongoose.connection.db;
      if (!db) return [];

      const profileCollection = db.collection('system.profile');
      const slowQueries = await profileCollection
        .find({ millis: { $gt: 100 } })
        .sort({ ts: -1 })
        .limit(10)
        .toArray();

      return slowQueries.map(query => ({
        operation: query.op,
        collection: query.ns.split('.')[1],
        duration: query.millis,
        timestamp: query.ts,
        query: query.query || query.command
      }));
    } catch (error) {
      console.error("Error getting query metrics:", error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or manual cache invalidation)
   */
  clearCache() {
    this.queryCache.clear();
    console.log("✅ Query cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      entries: Array.from(this.queryCache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
        ttl: value.ttl
      }))
    };
  }
}

export default new DatabaseOptimizationService();