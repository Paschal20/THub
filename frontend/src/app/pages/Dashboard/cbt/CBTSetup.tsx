import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import {
  useGenerateCBTQuizMutation,
  useStartCBTSessionMutation,
} from "../../../../Features/auth/authApi";
import toast from "react-hot-toast";

const CBTSetup: React.FC = () => {
  const [formData, setFormData] = useState<{
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    numQuestions: number;
    questionType: "multiple-choice" | "true-false" | "fill-in-the-blank";
    file?: File;
  }>({
    topic: "",
    difficulty: "easy",
    numQuestions: 5,
    questionType: "multiple-choice",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [generateCBTQuiz] = useGenerateCBTQuizMutation();
  const [startCBTSession] = useStartCBTSessionMutation();

  useEffect(() => {
    // Fetch past CBT quizzes if needed
  }, []);

  // Load selected file from navigation state
  useEffect(() => {
    const state = location.state as {
      selectedFileId?: string;
      selectedFileName?: string;
    };
    if (state?.selectedFileName) {
      setSelectedFileName(state.selectedFileName);
    }
  }, [location]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numQuestions" ? parseInt(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      setSelectedFileName(file.name);
      setShowFilePopup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const quizResult = await generateCBTQuiz(formData).unwrap();
      toast.success("CBT Quiz generated successfully!");

      // Start the session
      const sessionResult = await startCBTSession({ quizId: quizResult.data._id }).unwrap();
      toast.success("CBT Session started!");

      navigate("/dashboard/cbt-session", { state: { sessionToken: sessionResult.data.sessionToken } });
    } catch (error) {
      console.error("CBT Quiz generation failed:", error);
      toast.error((error as { data?: { message?: string } })?.data?.message || "Failed to generate CBT Quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearFile = () => {
    setFormData((prev) => ({ ...prev, file: undefined }));
    setSelectedFileName(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Links */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/dashboard/cbt-history")}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
            >
              View History
            </button>
            <button
              onClick={() => navigate("/dashboard/cbt-leaderboard")}
              className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
            >
              Leaderboard
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            CBT Quiz Setup
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic *
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleFormChange}
                placeholder="Enter the topic for your CBT quiz"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Difficulty Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                name="numQuestions"
                value={formData.numQuestions}
                onChange={handleFormChange}
                min="1"
                max="50"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Type
              </label>
              <select
                name="questionType"
                value={formData.questionType}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
                <option value="fill-in-the-blank">Fill in the Blank</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Content (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowFilePopup(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
                {selectedFileName && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFileName}
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isGenerating}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isGenerating ? "Generating CBT Quiz..." : "Generate CBT Quiz"}
              </button>
            </div>
          </form>

          {/* File Upload Popup */}
          {showFilePopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Upload Content File
                </h3>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full mb-4"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowFilePopup(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CBTSetup;