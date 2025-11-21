import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import {
  useGetQuizResultsQuery,
  useGetQuizByIdQuery,
  useDeleteQuizResultMutation,
} from "../../../../Features/auth/authApi";
import type { QuizResult, Question } from "../../../../Features/Types/types";
import Button from "../../../../Components/Button";

const PastQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResult | null>(null);
  const [page, setPage] = useState(1);
  const [allQuizResults, setAllQuizResults] = useState<QuizResult[]>([]);

  // New state variables for search, sort, filter, and delete
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "date-asc" | "date-desc" | "score-asc" | "score-desc"
  >("date-desc");
  const [filterBy, setFilterBy] = useState<"all" | "0-50" | "50-80" | "80-100">(
    "all"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<QuizResult | null>(null);

  const {
    data: quizResultsData,
    isLoading,
    error,
    isFetching,
  } = useGetQuizResultsQuery(
    { page, limit: 10 },
    { skip: selectedQuiz !== null } // Don't fetch when viewing details
  );

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Accumulate results from all pages
  useEffect(() => {
    if (quizResultsData?.data) {
      if (page === 1) {
        setAllQuizResults(quizResultsData.data);
      } else {
        setAllQuizResults((prev) => [...prev, ...quizResultsData.data]);
      }
    }
  }, [quizResultsData, page]);

  // Load next page when intersection observer triggers
  useEffect(() => {
    if (
      inView &&
      !isLoading &&
      !isFetching &&
      quizResultsData?.pagination?.hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  }, [inView, isLoading, isFetching, quizResultsData]);

  // Delete mutation
  const [deleteQuizResult] = useDeleteQuizResultMutation();

  const getPercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Filtered and sorted quiz results using useMemo
  const filteredAndSortedQuizResults = useMemo(() => {
    let filtered = allQuizResults;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((quiz) => {
        const topic = quiz.quizId_populated?.topic || "";
        const date = formatDate(quiz.completedAt || quiz.createdAt);
        return (
          topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          date.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply score filter
    if (filterBy !== "all") {
      filtered = filtered.filter((quiz) => {
        const percentage = getPercentage(quiz.score, quiz.totalQuestions);
        switch (filterBy) {
          case "0-50":
            return percentage >= 0 && percentage < 50;
          case "50-80":
            return percentage >= 50 && percentage < 80;
          case "80-100":
            return percentage >= 80 && percentage <= 100;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.completedAt || a.createdAt).getTime() -
            new Date(b.completedAt || b.createdAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.completedAt || b.createdAt).getTime() -
            new Date(a.completedAt || a.createdAt).getTime()
          );
        case "score-asc":
          return (
            getPercentage(a.score, a.totalQuestions) -
            getPercentage(b.score, b.totalQuestions)
          );
        case "score-desc":
          return (
            getPercentage(b.score, b.totalQuestions) -
            getPercentage(a.score, a.totalQuestions)
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [allQuizResults, searchTerm, filterBy, sortBy]);

  const quizResults = filteredAndSortedQuizResults;

  // Fetch quiz details when a quiz is selected for review
  const { data: quizDetails } = useGetQuizByIdQuery(
    selectedQuiz?.quizId || "",
    {
      skip: !selectedQuiz?.quizId,
    }
  );

  const handleQuizSelect = (quizResult: QuizResult) => {
    setSelectedQuiz(quizResult);
  };

  const handleDeleteQuiz = (quizResult: QuizResult) => {
    setQuizToDelete(quizResult);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (quizToDelete) {
      try {
        await deleteQuizResult(quizToDelete._id).unwrap();
        // Remove from local state
        setAllQuizResults((prev) =>
          prev.filter((q) => q._id !== quizToDelete._id)
        );
        setShowDeleteModal(false);
        setQuizToDelete(null);
      } catch (error) {
        console.error("Failed to delete quiz:", error);
        // Handle error (could show a toast notification)
      }
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9165] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading past quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load past quizzes</p>

          <Button  size="small" onClick={() => navigate("/dashboard/quiz")} text=" Generate New Quiz"/>
        </div>
      </div>
    );
  }

  if (selectedQuiz && quizDetails?.data) {
    const questions = quizDetails.data.questions || [];

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-6xl w-full text-left max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Past Quiz Review</h1>
              <p className="text-gray-600">
                Completed on{" "}
                {formatDate(selectedQuiz.completedAt || selectedQuiz.createdAt)}{" "}
                • Score: {selectedQuiz.score}/{selectedQuiz.totalQuestions} (
                {getPercentage(selectedQuiz.score, selectedQuiz.totalQuestions)}
                %)
              </p>
              <p className="text-sm text-gray-500">
                Topic: {quizDetails.data.topic || "N/A"} • Difficulty:{" "}
                {quizDetails.data.difficulty || "N/A"}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedQuiz(null);
              }}
              className="bg-[#0D9165] text-white px-4 py-2 rounded-lg hover:bg-[#0a7a52] text-sm font-medium"
            >
              Back to Past Quizzes
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((question: Question, index: number) => {
                const userAnswerKey = selectedQuiz.selectedAnswers[index];
                let userAnswer = null;
                let isCorrect = false;

                if (
                  question.type === "multiple-choice" ||
                  question.type === "true-false"
                ) {
                  // Options is an object { A: string, B: string, C: string, D: string }
                  const optionsArray = [
                    question.options.A,
                    question.options.B,
                    question.options.C,
                    question.options.D,
                  ];
                  let userAnswerIndex: number;
                  if (typeof userAnswerKey === "number") {
                    userAnswerIndex = userAnswerKey;
                  } else if (typeof userAnswerKey === "string") {
                    // Handle letter keys like "A", "B", "C", "D"
                    const answerKeys = ["A", "B", "C", "D"];
                    userAnswerIndex = answerKeys.indexOf(
                      (userAnswerKey as string).toUpperCase()
                    );
                  } else {
                    userAnswerIndex = -1;
                  }

                  if (
                    userAnswerIndex >= 0 &&
                    userAnswerIndex < optionsArray.length
                  ) {
                    userAnswer = optionsArray[userAnswerIndex];
                    isCorrect =
                      String.fromCharCode(65 + userAnswerIndex) ===
                      question.answer;
                  }
                } else if (question.type === "fill-in-the-blank") {
                  userAnswer = userAnswerKey;
                  // For fill-in-the-blank, use case-insensitive comparison with trimming
                  isCorrect =
                    String(userAnswerKey || "")
                      .toLowerCase()
                      .trim() === question.answer.toLowerCase().trim();
                }

                const correctAnswer =
                  question.type === "multiple-choice" ||
                  question.type === "true-false"
                    ? question.options[
                        question.answer as keyof typeof question.options
                      ]
                    : question.answer;

                return (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-3 text-sm">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Your answer:</span>{" "}
                        <span
                          className={
                            isCorrect
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {userAnswer || "No answer selected"}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-green-600 font-semibold">
                          {correctAnswer}
                        </span>
                      </p>
                    </div>
                    {question.explanation && (
                      <p className="mt-3 text-gray-700 italic text-sm">
                        <span className="font-medium">Explanation:</span>{" "}
                        {question.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="flex justify-between items-center w-full max-w-4xl mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0D9165]">Past Quizzes</h1>
        <button
          onClick={() => navigate("/dashboard/quiz")}
          className="bg-[#0D9165] text-white px-4 py-2 rounded-lg hover:bg-[#0a7a52] transition-colors"
        >
          Back to Quiz Setup
        </button>
      </div>

      {/* Controls Section */}
      <div className="w-full max-w-4xl mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by topic or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D9165] focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D9165] focus:border-transparent"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="score-desc">Score (Highest First)</option>
              <option value="score-asc">Score (Lowest First)</option>
            </select>
          </div>

          {/* Filter Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Score
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D9165] focus:border-transparent"
            >
              <option value="all">All Scores</option>
              <option value="0-50">0-50%</option>
              <option value="50-80">50-80%</option>
              <option value="80-100">80-100%</option>
            </select>
          </div>
        </div>
      </div>

      {quizResults.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">No past quizzes found.</p>
          <Button size="small" onClick={() => navigate("/dashboard/quiz")} text=" Generate New Quiz"/>
        </div>
      ) : (
        <div className="w-full max-w-4xl space-y-4">
          {quizResults.map((quizResult) => (
            <div
              key={quizResult._id}
              className="bg-white shadow-md rounded-lg p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Quiz Completed
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(quizResult.completedAt || quizResult.createdAt)}{" "}
                    • Time taken: {formatTime(quizResult.timeTaken)}
                  </p>
                  {quizResult.quizId_populated && (
                    <p className="text-sm text-gray-500">
                      Topic: {quizResult.quizId_populated.topic} • Difficulty:{" "}
                      {quizResult.quizId_populated.difficulty}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#0D9165]">
                    {quizResult.score}/{quizResult.totalQuestions}
                  </p>
                  <p className="text-sm text-gray-600">
                    {getPercentage(quizResult.score, quizResult.totalQuestions)}
                    %
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>Status: {quizResult.status}</p>
                  <p>Questions: {quizResult.totalQuestions}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleQuizSelect(quizResult)}
                    className="bg-[#0D9165] text-white px-4 py-2 rounded-lg hover:bg-[#0a7a52] transition-colors text-sm"
                  >
                    View Answers
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quizResult)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Infinite scroll trigger */}
          {quizResultsData?.pagination?.hasMore && (
            <div ref={ref} className="flex justify-center py-8">
              {isFetching ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0D9165]"></div>
                  <span className="text-gray-600">Loading more quizzes...</span>
                </div>
              ) : (
                <div className="h-4"></div> // Invisible trigger element
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && quizToDelete && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this quiz result? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setQuizToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastQuizzes;
