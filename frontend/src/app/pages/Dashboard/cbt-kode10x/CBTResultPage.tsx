import { useState } from "react";
import { RefreshCcw, CheckCircle, XCircle, Award } from "lucide-react";

export default function CBTResultPage({ results, onRetakeQuiz, onViewLeaderboard }) {
  const [showFailedQuestions, setShowFailedQuestions] = useState(false);

  if (!results) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-gray-600">No quiz results available.</div>
        <div className="text-sm text-gray-500">Please complete a CBT quiz first.</div>
        <button
          onClick={() => window.history.back()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { totalQuestions, correctAnswers, percentage, details } = results;
  const safeTotalQuestions = (typeof totalQuestions === 'number' && !Number.isNaN(totalQuestions)) ? totalQuestions : 0;
  const safeCorrectAnswers = (typeof correctAnswers === 'number' && !Number.isNaN(correctAnswers)) ? correctAnswers : 0;
  const safePercentage = (typeof percentage === 'number' && !Number.isNaN(percentage)) ? percentage : 0;
  const incorrectAnswers = safeTotalQuestions - safeCorrectAnswers;

  return (
    <div className="space-y-6 py-10 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">CBT Results</h1>
        <p className="text-gray-600">Here's how you performed</p>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-100">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-center py-8">
          <div className="flex justify-center mb-4">
            {percentage >= 70 ? (
              <Award className="h-16 w-16 text-yellow-300" />
            ) : (
              <CheckCircle className="h-16 w-16 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {safePercentage >= 70 ? "Excellent Work!" : "Quiz Completed!"}
          </h2>
          <p className="text-emerald-100 mt-2">Great job on completing the CBT quiz!</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="bg-emerald-50 text-emerald-800 rounded-2xl px-8 py-6 text-center shadow-sm">
              <div className="text-sm font-medium uppercase tracking-wide">Your Score</div>
              <div className="text-5xl font-bold mt-2">
                {safeCorrectAnswers}
                <span className="text-2xl font-normal text-emerald-600">
                  {" "}/ {safeTotalQuestions}
                </span>
              </div>
              <div className="text-lg font-semibold mt-2 text-emerald-700">
                {safePercentage}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
               <div className="text-2xl font-bold text-green-700">{safeCorrectAnswers}</div>
              <div className="text-sm text-green-600 font-medium">Correct</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
               <div className="text-2xl font-bold text-red-700">{Math.max(0, incorrectAnswers)}</div>
              <div className="text-sm text-red-600 font-medium">Incorrect</div>
            </div>
          </div>

          {details && Array.isArray(details) && details.filter(q => !q.isCorrect).length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowFailedQuestions(!showFailedQuestions)}
                className="w-full text-left flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                 <span className="font-medium text-gray-700">
                   Review Incorrect Answers ({Array.isArray(details) ? details.filter(q => !q.isCorrect).length : 0})
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
                  {Array.isArray(details) && details.filter(q => !q.isCorrect).map((question, index) => (
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
        </div>

        <div className="border-t border-emerald-100 p-4 bg-emerald-50 flex justify-center gap-4">
          <button
            onClick={onViewLeaderboard}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <Award className="h-4 w-4" />
            View Leaderboard
          </button>
          <button
            onClick={onRetakeQuiz}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Retake CBT Quiz
          </button>
        </div>
      </div>
    </div>
  );
}