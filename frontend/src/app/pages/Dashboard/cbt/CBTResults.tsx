import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaTrophy, FaCheckCircle, FaTimesCircle, FaFlag, FaArrowLeft, FaHistory, FaRedo } from "react-icons/fa";
import { useGetCBTResultByIdQuery } from "../../../../Features/auth/authApi";
import toast from "react-hot-toast";

interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface CBTResultWithQuiz {
  _id: string;
  quizId: string | { title: string; topic: string; difficulty: string };
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTaken: number;
  completedAt: string;
  selectedAnswers: Map<string, string>;
  analytics: {
    accuracy: number;
    averageTimePerQuestion: number;
    difficultyBreakdown: any;
    questionTypeBreakdown: any;
    timeDistribution: Map<string, number>;
    streak: any;
    confidenceRating?: number;
    areasForImprovement: string[];
  };
}

const CBTResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resultId } = location.state as { resultId?: string };

  const [showIncorrect, setShowIncorrect] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);

  const { data: resultData, isLoading, error } = useGetCBTResultByIdQuery(resultId || "");

  const result = resultData?.data as CBTResultWithQuiz | undefined;

  useEffect(() => {
    if (error) {
      toast.error("Failed to load CBT results");
      navigate("/dashboard/cbt-history");
    }
  }, [error, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl">Loading CBT Results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-red-500">Result not found</div>
      </div>
    );
  }

   const {
     totalQuestions,
     selectedAnswers,
     completedAt,
     analytics
   } = result;

  // Calculate derived values
  const correctAnswers = analytics?.accuracy ? Math.round((analytics.accuracy / 100) * totalQuestions) : 0;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const flaggedQuestions: string[] = []; // This would need to come from session metadata
  const answers: Answer[] = Array.from(selectedAnswers.entries()).map(([questionId, answer]) => ({
    questionId,
    userAnswer: answer,
    isCorrect: true // This would need proper calculation
  }));

  const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getIncorrectAnswers = (): Answer[] => {
    return answers.filter((answer) => !answer.isCorrect);
  };

  const getFlaggedAnswers = (): Answer[] => {
    return answers.filter((answer) => flaggedQuestions?.includes(answer.questionId));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard/cbt-history")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <FaArrowLeft />
            Back to History
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Completed on {completedAt ? new Date(completedAt).toLocaleDateString() : 'Unknown'}
          </div>
        </div>

        {/* Results Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {successRate >= 70 ? (
                <FaTrophy className="text-6xl text-yellow-500" />
              ) : (
                <FaCheckCircle className="text-6xl text-green-500" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {successRate >= 70 ? "Excellent Work!" : "Quiz Completed!"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
               CBT Quiz: {result?.quizId && typeof result.quizId === 'object' && 'title' in result.quizId ? result.quizId.title : 'Unknown Quiz'}
            </p>
          </div>

          {/* Score Display */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl px-8 py-6 text-center shadow-lg">
              <div className="text-sm font-medium uppercase tracking-wide mb-2">Your Score</div>
              <div className="text-5xl font-bold mb-2">
                {correctAnswers}
                <span className="text-2xl font-normal text-blue-200">
                  {" "} / {totalQuestions}
                </span>
              </div>
              <div className="text-xl font-semibold text-blue-200">
                {successRate}% Success Rate
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <FaCheckCircle className="text-2xl text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{correctAnswers}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Correct</div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <FaTimesCircle className="text-2xl text-red-600 dark:text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{incorrectAnswers}</div>
              <div className="text-sm text-red-600 dark:text-red-400">Incorrect</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <FaFlag className="text-2xl text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{flaggedQuestions?.length || 0}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Flagged</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatTime(result.timeTaken || 0)}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Time Spent</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/dashboard/cbt")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaRedo />
              Take Another Quiz
            </button>
            <button
              onClick={() => navigate("/dashboard/cbt-history")}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FaHistory />
              View History
            </button>
          </div>
        </div>

        {/* Review Sections */}
        <div className="space-y-6">
          {/* Incorrect Answers */}
          {incorrectAnswers > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => setShowIncorrect(!showIncorrect)}
                className="w-full p-6 text-left bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FaTimesCircle className="text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Review Incorrect Answers ({incorrectAnswers})
                  </span>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${showIncorrect ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showIncorrect && (
                <div className="p-6 space-y-4">
                  {getIncorrectAnswers().map((answer: Answer, index: number) => (
                    <div key={answer.questionId} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        Question {index + 1}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <FaTimesCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Your answer: </span>
                            <span className="text-red-700 dark:text-red-300 font-medium">{answer.userAnswer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flagged Questions */}
          {flaggedQuestions && flaggedQuestions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => setShowFlagged(!showFlagged)}
                className="w-full p-6 text-left bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FaFlag className="text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Review Flagged Questions ({flaggedQuestions.length})
                  </span>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${showFlagged ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFlagged && (
                <div className="p-6 space-y-4">
                  {getFlaggedAnswers().map((answer: Answer, index: number) => (
                    <div key={answer.questionId} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="font-medium text-gray-900 dark:text-white mb-2">
                        Question {index + 1}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Your answer: </span>
                          <span className="text-blue-700 dark:text-blue-300 font-medium">{answer.userAnswer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CBTResults;