import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory, FaCalendar, FaTrophy, FaArrowLeft, FaEye, FaFilter } from "react-icons/fa";
import { useGetCBTResultsQuery } from "../../../../Features/auth/authApi";
import toast from "react-hot-toast";

const CBTQuizHistory: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const { data: resultsData, isLoading, error } = useGetCBTResultsQuery({ page, limit });

  const results = resultsData?.data?.results || [];
  const pagination = resultsData?.data?.pagination;

  React.useEffect(() => {
    if (error) {
      toast.error("Failed to load CBT history");
    }
  }, [error]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number, total: number): string => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl">Loading CBT History...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FaHistory className="text-blue-600" />
                CBT Quiz History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Review your past CBT quiz performances
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FaFilter />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
              <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-score">Highest Score</option>
                <option value="lowest-score">Lowest Score</option>
              </select>
            </div>
          </div>
        )}

        {/* Results List */}
        {results.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
            <FaHistory className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No CBT Quizzes Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't taken any CBT quizzes yet. Start your first quiz to see your history here.
            </p>
            <button
              onClick={() => navigate("/dashboard/cbt")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Your First CBT Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
                      <FaTrophy className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.quiz.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FaCalendar />
                          {formatDate(result.completedAt)}
                        </span>
                         <span>Time: {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard/cbt-results", { state: { resultId: result._id } })}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FaEye />
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(result.score, result.totalQuestions)}`}>
                      {result.score}/{result.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSuccessRateColor(result.percentage)}`}>
                      {result.percentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.performanceRating}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CBTQuizHistory;