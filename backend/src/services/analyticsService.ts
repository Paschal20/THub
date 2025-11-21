// src/services/analyticsService.ts
import QuizResult, { IQuizResult } from "../models/QuizResult";
import Quiz from "../models/Quiz";
import databaseOptimizationService from "./databaseOptimizationService";

export interface UserAnalytics {
  totalQuizzes: number;
  averageScore: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  bestScore: number;
  recentQuizzes: Array<{
    quizId: string;
    score: number;
    completedAt: Date | undefined;
  }>;
  performanceByDifficulty: {
    easy: { average: number; count: number };
    medium: { average: number; count: number };
    hard: { average: number; count: number };
  };
  performanceByQuestionType: {
    "multiple-choice": { average: number; count: number };
    "true-false": { average: number; count: number };
    "fill-in-the-blank": { average: number; count: number };
  };
  timeManagement: {
    averageTimePerQuestion: number;
    fastestQuiz: number;
    slowestQuiz: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
  improvementAreas: string[];
}

export interface QuizAnalytics {
  quizId: string;
  title: string | undefined;
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  completionRate: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypeBreakdown: {
    "multiple-choice": number;
    "true-false": number;
    "fill-in-the-blank": number;
  };
  topPerformers: Array<{
    userId: string;
    score: number;
    timeTaken: number;
  }>;
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics for a user (optimized with caching)
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      // Use cached analytics for better performance
      const cachedAnalytics =
        await databaseOptimizationService.getUserAnalyticsCached(userId);

      // Get detailed results for complex calculations (limit to recent 100 for performance)
      const results = await QuizResult.find({
        userId,
        status: "completed",
      })
        .sort({ completedAt: -1 })
        .limit(100)
        .select(
          "score analytics.accuracy analytics.averageTimePerQuestion timeTaken completedAt difficulty questionTypes"
        );

      if (results.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Use cached basic stats where possible
      const totalQuizzes = cachedAnalytics.totalQuizzes;
      const averageScore = cachedAnalytics.averageScore;

      // Calculate accuracy and time from detailed results
      const totalAccuracy = results.reduce(
        (sum, result) => sum + result.analytics.accuracy,
        0
      );
      const averageAccuracy = Math.round(totalAccuracy / results.length);

      const totalTimeSpent = results.reduce(
        (sum, result) => sum + result.timeTaken,
        0
      );
      const bestScore = Math.max(...results.map((r) => r.score));

      // Recent quizzes from cache
      const recentQuizzes = cachedAnalytics.recentResults;

      // Performance calculations (optimized)
      const performanceByDifficulty =
        this.calculatePerformanceByDifficulty(results);
      const performanceByQuestionType =
        this.calculatePerformanceByQuestionType(results);
      const timeManagement = this.calculateTimeManagement(results);
      const streaks = this.calculateStreaks(results);
      const improvementAreas = this.generateImprovementAreas(results);

      return {
        totalQuizzes,
        averageScore,
        averageAccuracy,
        totalTimeSpent,
        bestScore,
        recentQuizzes,
        performanceByDifficulty,
        performanceByQuestionType,
        timeManagement,
        streaks,
        improvementAreas,
      };
    } catch (error) {
      console.error("Error getting user analytics:", error);
      throw new Error("Failed to retrieve user analytics");
    }
  }

  /**
   * Get analytics for a specific quiz
   */
  async getQuizAnalytics(quizId: string): Promise<QuizAnalytics> {
    try {
      const results = await QuizResult.find({
        quizId,
        status: "completed",
      }).sort({ score: -1 });

      const quiz = await Quiz.findOne({ _id: quizId });

      if (results.length === 0) {
        return {
          quizId,
          title: quiz?.title,
          totalAttempts: 0,
          averageScore: 0,
          averageTime: 0,
          completionRate: 0,
          difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
          questionTypeBreakdown: {
            "multiple-choice": 0,
            "true-false": 0,
            "fill-in-the-blank": 0,
          },
          topPerformers: [],
        };
      }

      const totalAttempts = results.length;
      const averageScore = Math.round(
        results.reduce((sum, r) => sum + r.score, 0) / totalAttempts
      );
      const averageTime = Math.round(
        results.reduce((sum, r) => sum + r.timeTaken, 0) / totalAttempts
      );
      const completionRate = Math.round(
        results.reduce((sum, r) => sum + r.analytics.accuracy, 0) /
          totalAttempts
      );

      // Difficulty breakdown
      const difficultyBreakdown = results.reduce(
        (acc, result) => {
          acc[result.difficulty as keyof typeof acc]++;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0 }
      );

      // Question type breakdown (simplified - just count attempts)
      const questionTypeBreakdown = {
        "multiple-choice": 0,
        "true-false": 0,
        "fill-in-the-blank": 0,
      };
      results.forEach((result) => {
        if (result.questionTypes) {
          result.questionTypes.forEach((type) => {
            if (type in questionTypeBreakdown) {
              questionTypeBreakdown[
                type as keyof typeof questionTypeBreakdown
              ]++;
            }
          });
        }
      });

      // Top performers (top 5)
      const topPerformers = results.slice(0, 5).map((result) => ({
        userId: result.userId,
        score: result.score,
        timeTaken: result.timeTaken,
      }));

      return {
        quizId,
        title: quiz?.title,
        totalAttempts,
        averageScore,
        averageTime,
        completionRate,
        difficultyBreakdown,
        questionTypeBreakdown,
        topPerformers,
      };
    } catch (error) {
      console.error("Error getting quiz analytics:", error);
      throw new Error("Failed to retrieve quiz analytics");
    }
  }

  /**
   * Get global analytics (for admin dashboard) - optimized with single aggregation
   */
  async getGlobalAnalytics(): Promise<{
    totalUsers: number;
    totalQuizzes: number;
    totalQuizAttempts: number;
    averageScore: number;
    popularDifficulties: { easy: number; medium: number; hard: number };
    popularQuestionTypes: {
      "multiple-choice": number;
      "true-false": number;
      "fill-in-the-blank": number;
    };
  }> {
    try {
      // Use cached version for better performance
      const cacheKey = "global_analytics";
      return await databaseOptimizationService.getCachedData(
        cacheKey,
        async () => {
          // Single optimized aggregation pipeline
          const globalStats = await QuizResult.aggregate([
            { $match: { status: "completed" } },
            {
              $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                averageScore: { $avg: "$score" },
                uniqueUsers: { $addToSet: "$userId" },
                uniqueQuizzes: { $addToSet: "$quizId" },
                difficultyBreakdown: {
                  $push: "$difficulty",
                },
                questionTypesBreakdown: {
                  $push: "$questionTypes",
                },
              },
            },
          ]);

          if (globalStats.length === 0) {
            return {
              totalUsers: 0,
              totalQuizzes: 0,
              totalQuizAttempts: 0,
              averageScore: 0,
              popularDifficulties: { easy: 0, medium: 0, hard: 0 },
              popularQuestionTypes: {
                "multiple-choice": 0,
                "true-false": 0,
                "fill-in-the-blank": 0,
              },
            };
          }

          const stats = globalStats[0];

          // Process difficulty distribution
          const difficultyCount = stats.difficultyBreakdown.reduce(
            (acc: any, diff: string) => {
              acc[diff] = (acc[diff] || 0) + 1;
              return acc;
            },
            {}
          );

          const popularDifficulties = {
            easy: difficultyCount.easy || 0,
            medium: difficultyCount.medium || 0,
            hard: difficultyCount.hard || 0,
          };

          // Process question type distribution
          const questionTypeCount = stats.questionTypesBreakdown
            .flat()
            .reduce((acc: any, type: string) => {
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});

          const popularQuestionTypes = {
            "multiple-choice": questionTypeCount["multiple-choice"] || 0,
            "true-false": questionTypeCount["true-false"] || 0,
            "fill-in-the-blank": questionTypeCount["fill-in-the-blank"] || 0,
          };

          return {
            totalUsers: stats.uniqueUsers.length,
            totalQuizzes: stats.uniqueQuizzes.length,
            totalQuizAttempts: stats.totalAttempts,
            averageScore: Math.round(stats.averageScore * 100) / 100,
            popularDifficulties,
            popularQuestionTypes,
          };
        },
        15 * 60 * 1000
      ); // 15 minute cache for global stats
    } catch (error) {
      console.error("Error getting global analytics:", error);
      throw new Error("Failed to retrieve global analytics");
    }
  }

  private getEmptyAnalytics(): UserAnalytics {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      averageAccuracy: 0,
      totalTimeSpent: 0,
      bestScore: 0,
      recentQuizzes: [],
      performanceByDifficulty: {
        easy: { average: 0, count: 0 },
        medium: { average: 0, count: 0 },
        hard: { average: 0, count: 0 },
      },
      performanceByQuestionType: {
        "multiple-choice": { average: 0, count: 0 },
        "true-false": { average: 0, count: 0 },
        "fill-in-the-blank": { average: 0, count: 0 },
      },
      timeManagement: {
        averageTimePerQuestion: 0,
        fastestQuiz: 0,
        slowestQuiz: 0,
      },
      streaks: {
        current: 0,
        longest: 0,
      },
      improvementAreas: [],
    };
  }

  private calculatePerformanceByDifficulty(results: IQuizResult[]) {
    const difficultyGroups = results.reduce((acc, result) => {
      const difficulty = result.difficulty;
      if (difficulty && !acc[difficulty]) {
        acc[difficulty] = { scores: [], count: 0 };
      }
      if (difficulty) {
        if (!acc[difficulty]) {
          acc[difficulty] = { scores: [], count: 0 };
        }
        acc[difficulty].scores.push(result.score);
        acc[difficulty].count++;
      }
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    const easy = difficultyGroups["easy"] || { scores: [], count: 0 };
    const medium = (difficultyGroups as any)["medium"] || {
      scores: [],
      count: 0,
    };
    const hard = (difficultyGroups as any)["hard"] || { scores: [], count: 0 };

    return {
      easy: {
        average:
          easy.scores.length > 0
            ? Math.round(
                easy.scores.reduce((a: number, b: number) => a + b, 0) /
                  easy.scores.length
              )
            : 0,
        count: easy.count,
      },
      medium: {
        average:
          medium.scores.length > 0
            ? Math.round(
                medium.scores.reduce((a: number, b: number) => a + b, 0) /
                  medium.scores.length
              )
            : 0,
        count: medium.count,
      },
      hard: {
        average:
          hard.scores.length > 0
            ? Math.round(
                hard.scores.reduce((a: number, b: number) => a + b, 0) /
                  hard.scores.length
              )
            : 0,
        count: hard.count,
      },
    };
  }

  private calculatePerformanceByQuestionType(results: IQuizResult[]) {
    // This is a simplified calculation - in a real implementation,
    // you'd need to track performance per question type within each quiz
    const typeGroups = results.reduce((acc, result) => {
      if (result.questionTypes) {
        result.questionTypes.forEach((type) => {
          if (!acc[type]) {
            acc[type] = { scores: [], count: 0 };
          }
          acc[type].scores.push(result.score);
          acc[type].count++;
        });
      }
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    return {
      "multiple-choice": {
        average: typeGroups["multiple-choice"]
          ? Math.round(
              typeGroups["multiple-choice"].scores.reduce((a, b) => a + b, 0) /
                typeGroups["multiple-choice"].scores.length
            )
          : 0,
        count: typeGroups["multiple-choice"]?.count || 0,
      },
      "true-false": {
        average: typeGroups["true-false"]
          ? Math.round(
              typeGroups["true-false"].scores.reduce((a, b) => a + b, 0) /
                typeGroups["true-false"].scores.length
            )
          : 0,
        count: typeGroups["true-false"]?.count || 0,
      },
      "fill-in-the-blank": {
        average: typeGroups["fill-in-the-blank"]
          ? Math.round(
              typeGroups["fill-in-the-blank"].scores.reduce(
                (a, b) => a + b,
                0
              ) / typeGroups["fill-in-the-blank"].scores.length
            )
          : 0,
        count: typeGroups["fill-in-the-blank"]?.count || 0,
      },
    };
  }

  private calculateTimeManagement(results: IQuizResult[]) {
    if (results.length === 0) {
      return {
        averageTimePerQuestion: 0,
        fastestQuiz: 0,
        slowestQuiz: 0,
      };
    }

    const times = results.map((r) => r.timeTaken);
    const totalTime = times.reduce((a, b) => a + b, 0);
    const totalQuestions = results.reduce((a, b) => a + b.totalQuestions, 0);

    return {
      averageTimePerQuestion: Math.round(totalTime / totalQuestions),
      fastestQuiz: Math.min(...times),
      slowestQuiz: Math.max(...times),
    };
  }

  private calculateStreaks(results: IQuizResult[]) {
    if (results.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Sort by completion date (most recent first)
    const sortedResults = results.sort(
      (a, b) =>
        new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks based on consecutive good performances (score >= 70%)
    for (const result of sortedResults) {
      const percentage = (result.score / result.totalQuestions) * 100;
      if (percentage >= 70) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
        if (currentStreak === 0) currentStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  private generateImprovementAreas(results: IQuizResult[]): string[] {
    const areas: string[] = [];

    if (results.length === 0) return areas;

    const avgAccuracy =
      results.reduce((sum, r) => sum + r.analytics.accuracy, 0) /
      results.length;
    const avgTime =
      results.reduce((sum, r) => sum + r.analytics.averageTimePerQuestion, 0) /
      results.length;

    if (avgAccuracy < 70) {
      areas.push("Focus on improving accuracy through more practice");
    }

    if (avgTime > 90) {
      // More than 1.5 minutes per question
      areas.push("Work on time management and speed");
    }

    // Check difficulty performance
    const hardResults = results.filter((r) => r.difficulty === "hard");
    if (hardResults.length > 0) {
      const hardAvg =
        hardResults.reduce((sum, r) => sum + r.analytics.accuracy, 0) /
        hardResults.length;
      if (hardAvg < 60) {
        areas.push("Practice more challenging questions");
      }
    }

    return areas;
  }
}

export default new AnalyticsService();
