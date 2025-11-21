import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaClock, FaFlag, FaPause, FaPlay } from "react-icons/fa";
import {
  useGetCBTSessionQuery,
  useSubmitCBTAnswerMutation,
  useFlagCBTQuestionMutation,
  usePauseCBTSessionMutation,
  useResumeCBTSessionMutation,
  useSubmitCBTQuizMutation,
} from "../../../../Features/auth/authApi";
import toast from "react-hot-toast";

const CBTQuizPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionToken } = location.state as { sessionToken: string };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: sessionData, isLoading } = useGetCBTSessionQuery(sessionToken);
  const [submitAnswer] = useSubmitCBTAnswerMutation();
  const [flagQuestion] = useFlagCBTQuestionMutation();
  const [pauseSession] = usePauseCBTSessionMutation();
  const [resumeSession] = useResumeCBTSessionMutation();
  const [submitQuiz] = useSubmitCBTQuizMutation();

  const session = sessionData?.data?.session;
  const quiz = sessionData?.data?.quiz;
  const questions = quiz?.questions || [];

  const handleSubmitQuiz = useCallback(async () => {
    try {
      const result = await submitQuiz({ sessionToken }).unwrap();
      toast.success("Quiz submitted successfully!");
      navigate("/dashboard/cbt-results", { state: { resultId: result.data._id } });
    } catch {
      toast.error("Failed to submit quiz");
    }
  }, [submitQuiz, sessionToken, navigate]);

  useEffect(() => {
    if (session) {
      setTimeRemaining(session.timeRemaining);
      setCurrentQuestionIndex(session.currentQuestionIndex);
      setIsPaused(session.status === "paused");
      // Load existing answers and flags
      setFlaggedQuestions(new Set(session.flaggedQuestions || []));
    }
  }, [session]);

  useEffect(() => {
    if (timeRemaining > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isPaused, handleSubmitQuiz]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = async (questionId: string, answer: string) => {
    try {
      await submitAnswer({ sessionToken, questionId, answer }).unwrap();
      setSelectedAnswers((prev) => new Map(prev.set(questionId, answer)));
    } catch {
      toast.error("Failed to submit answer");
    }
  };

  const handleFlagQuestion = async (questionId: string) => {
    try {
      await flagQuestion({ sessionToken, questionId }).unwrap();
      setFlaggedQuestions((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) {
          newSet.delete(questionId);
        } else {
          newSet.add(questionId);
        }
        return newSet;
      });
    } catch {
      toast.error("Failed to flag question");
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await resumeSession({ sessionToken }).unwrap();
        setIsPaused(false);
        toast.success("Session resumed");
      } else {
        await pauseSession({ sessionToken }).unwrap();
        setIsPaused(true);
        toast.success("Session paused");
      }
    } catch {
      toast.error("Failed to update session");
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl">Loading CBT Session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-red-500">Session not found</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaClock className="text-blue-500" />
                <span className="text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePauseResume}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                {isPaused ? <FaPlay /> : <FaPause />}
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Submit Quiz
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>

          {/* Question Navigation */}
          <div className="flex flex-wrap gap-2 mb-4">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-blue-500 text-white"
                    : selectedAnswers.has(questions[index]._id)
                    ? "bg-green-500 text-white"
                    : flaggedQuestions.has(questions[index]._id)
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentQuestion.question}
              </h2>
              <button
                onClick={() => handleFlagQuestion(currentQuestion._id)}
                className={`p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestion._id)
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-yellow-200"
                }`}
              >
                <FaFlag />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion._id}`}
                    value={key}
                    checked={selectedAnswers.get(currentQuestion._id) === key}
                    onChange={() => handleAnswerSelect(currentQuestion._id, key)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <span className="text-gray-900 dark:text-white">
                    <strong>{key}.</strong> {value}
                  </span>
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CBTQuizPage;