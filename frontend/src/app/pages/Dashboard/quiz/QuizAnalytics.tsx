import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetQuizAnalyticsQuery } from "../../../../Features/auth/authApi";

const QuizAnalyticsComponent: React.FC = () => {
  const navigate = useNavigate();
  const { data: analyticsData, isLoading, error } = useGetQuizAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9165] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const analytics = analyticsData?.data;

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0D9165]">Quiz Analytics</h1>
          <button
            onClick={() => navigate("/dashboard/quiz")}
            className="bg-[#0D9165] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#0a7a52] transition-colors"
          >
            Back to Quiz Setup
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Total Quizzes
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-[#0D9165]">
              {analytics.totalQuizzes}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Average Score
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-[#0D9165]">
              {analytics.averageScore}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Average Time
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-[#0D9165]">
              {analytics.averageTime}s
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Score Ranges
            </h3>
            <div className="text-sm">
              <p>0-50%: {analytics.scoreRanges["0-50"]}</p>
              <p>50-80%: {analytics.scoreRanges["50-80"]}</p>
              <p>80-100%: {analytics.scoreRanges["80-100"]}</p>
            </div>
          </div>
        </div>

        {/* Recent Results Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Recent Quiz Performance
          </h2>
          <div className="space-y-4">
            {analytics.recentResults.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{result.date}</p>
                  <p className="text-sm text-gray-600">
                    Score: {result.score}/{result.totalQuestions} (
                    {result.percentage}%)
                  </p>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0D9165] h-2 rounded-full"
                    style={{ width: `${result.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Performance by Difficulty
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Easy</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.performanceByDifficulty.easy.average}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {analytics.performanceByDifficulty.easy.average}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Medium</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.performanceByDifficulty.medium.average}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {analytics.performanceByDifficulty.medium.average}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Hard</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.performanceByDifficulty.hard.average}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {analytics.performanceByDifficulty.hard.average}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Performance by Question Type
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Multiple Choice</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.performanceByQuestionType["multiple-choice"].average}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {
                      analytics.performanceByQuestionType["multiple-choice"]
                        .average
                    }
                    %
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>True/False</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.performanceByQuestionType["true-false"].average}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {analytics.performanceByQuestionType["true-false"].average}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Fill in the Blank</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${analytics.performanceByQuestionType["fill-in-the-blank"].average}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">
                    {
                      analytics.performanceByQuestionType["fill-in-the-blank"]
                        .average
                    }
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAnalyticsComponent;
