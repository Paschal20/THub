import { useState } from 'react';
import { RefreshCcw, CheckCircle, XCircle, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetCBTUserResultsQuery } from '../../Features/auth/authApi';
import type { RootState } from '../../app/store';

interface QuizQuestion {
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
}



export default function ResultPage() {
    const navigate = useNavigate();
    const [showFailedQuestions, setShowFailedQuestions] = useState(false);

    const user = useSelector((state: RootState) => state.auth.user);
    const userId = user?.id || null;

  const { data: resultsData, isLoading: loading } = useGetCBTUserResultsQuery(userId || "", {
    skip: !userId
  });

  const results = resultsData?.data || null;

  const handleRetakeQuiz = () => {
    sessionStorage.removeItem("selectedSubject");
    navigate("/dashboard/cbt/subject");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("selectedSubject");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="text-center py-10 h-[500px] justify-center flex items-center flex-col">
        <svg className="animate-spin h-10 w-10 text-emerald-700" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-2xl text-emerald-700 font-semibold">Loading Results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Unable to load results.</p>
      </div>
    );
  }

  const { userData, latestQuiz, failedQuestions, skippedQuestions } = results;
  const successRate = parseFloat(latestQuiz?.successRate || '0');
  const skippedCount = skippedQuestions?.length || 0;
  const incorrectAnswers = (latestQuiz?.totalQuestions || 0) - (latestQuiz?.correctAnswers || 0);

  return (
    <div className="space-y-6 py-10 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Quiz Results</h1>
        <p className="text-gray-600">Here's how you performed</p>
      </div>

      {/* Main Results Card */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-100">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-center py-8">
          <div className="flex justify-center mb-4">
            {successRate >= 70 ? (
              <Award className="h-16 w-16 text-yellow-300" />
            ) : (
              <TrendingUp className="h-16 w-16 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {successRate >= 70 ? "Excellent Work!" : "Quiz Completed!"}
          </h2>
           <p className="text-emerald-100 mt-2">Congratulations, {userData?.fullName || 'User'}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Score Display */}
          <div className="flex justify-center">
            <div className="bg-emerald-50 text-emerald-800 rounded-2xl px-8 py-6 text-center shadow-sm">
              <div className="text-sm font-medium uppercase tracking-wide">Your Score</div>
              <div className="text-5xl font-bold mt-2">
                {latestQuiz.correctAnswers}
                <span className="text-2xl font-normal text-emerald-600">
                  {" "}/ {latestQuiz.totalQuestions}
                </span>
              </div>
              <div className="text-lg font-semibold mt-2 text-emerald-700">
                {latestQuiz.successRate}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-700">{latestQuiz.correctAnswers}</div>
              <div className="text-sm text-green-600 font-medium">Correct</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-700">{incorrectAnswers}</div>
              <div className="text-sm text-red-600 font-medium">Incorrect</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-yellow-700">{skippedCount}</div>
              <div className="text-sm text-yellow-600 font-medium">Skipped</div>
            </div>
          </div>

          {/* Total Score */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 font-medium">Total Cumulative Score</div>
             <div className="text-3xl font-bold text-gray-900 mt-1">{userData?.totalScore || 0}</div>
            <div className="text-xs text-gray-500 mt-1">All-Time Points</div>
          </div>

          {/* Failed Questions Toggle */}
          {failedQuestions.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowFailedQuestions(!showFailedQuestions)}
                className="w-full text-left flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="font-medium text-gray-700">
                  Review Incorrect Answers ({failedQuestions.length})
                </span>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${showFailedQuestions ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFailedQuestions && (
                <div className="mt-4 space-y-3">
                   {failedQuestions.map((question: QuizQuestion, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.questionText}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600">Your answer: </span>
                            <span className="text-red-700 font-medium">{question.userAnswer}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-600">Correct answer: </span>
                            <span className="text-green-700 font-medium">{question.correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skipped Questions Section */}
          {skippedCount > 0 && skippedQuestions && (
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-yellow-800">
                    Skipped Questions ({skippedCount})
                  </span>
                </div>
                <div className="space-y-2">
                   {skippedQuestions.map((question: QuizQuestion, index: number) => (
                    <div key={index} className="bg-white border border-yellow-300 rounded-md p-3">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {index + 1}. {question.questionText}
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-600">Correct answer: </span>
                          <span className="text-green-700 font-medium">{question.correctAnswer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-emerald-100 p-4 bg-emerald-50 flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate("/dashboard/cbt/leaderboard")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Leaderboard
          </button>
          <button
            onClick={() => navigate("/dashboard/cbt/history")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            History
          </button>
          <button
            onClick={handleRetakeQuiz}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Retake Quiz
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}