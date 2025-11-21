import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import {
  useGenerateQuizMutation,
} from "../../../../Features/auth/authApi";
import { useAppSelector } from "../../../../app/hooks/hooks";
import toast from "react-hot-toast";
import type { Quiz } from "../../../../Features/Types/types";
import Button from "../../../../Components/Button";

const QuizSetup: React.FC = () => {
  const [formData, setFormData] = useState({
    topic: "",
    difficulty: "easy",
    numQuestions: 10,
    questionType: "",
    file: undefined as File | undefined,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const quizzes: Quiz[] = [];
  const navigate = useNavigate();
  const location = useLocation();
  const [generateQuiz] = useGenerateQuizMutation();
  const auth = useAppSelector((state) => state.auth);



  useEffect(() => {
    // Fetch past quizzes if needed
    // For now, we'll keep it empty or fetch from API
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



  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const result = await generateQuiz({
        topic: formData.topic,
        difficulty: formData.difficulty,
        numQuestions: formData.numQuestions,
        questionType: formData.questionType || undefined,
        file: formData.file,
      }).unwrap();

      // Store session data for current quiz
      localStorage.setItem("questions", JSON.stringify(result.data.questions));
      localStorage.setItem("quizSessionToken", result.data.sessionToken);
      localStorage.setItem("quizId", result.data.quizId);
      localStorage.setItem("playerName", auth.user?.fullName || "Anonymous");
      localStorage.setItem("quizTotalTime", result.data.totalTime.toString());
      localStorage.setItem(
        "requestedQuestions",
        formData.numQuestions.toString()
      );

      // Store quiz data persistently for retaking
      const quizData = {
        questions: result.data.questions,
        quizId: result.data.quizId,
        totalTime: result.data.totalTime,
        numQuestions: formData.numQuestions,
        topic: formData.topic,
        difficulty: formData.difficulty,
        questionType: formData.questionType,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`quiz_${result.data.quizId}`, JSON.stringify(quizData));

      toast.success("Quiz generated successfully!");
      navigate("/dashboard/quizQuest");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectQuiz = () => {
    navigate("/dashboard/quizQuest");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 sm:py-10 px-3 sm:px-4">
      <h1 className="text-lg sm:text-2xl font-bold mb-2 text-[#0D9165]">
        Generate WAEC/NECO/JAMB Style Quiz
      </h1>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 break-words">
        Create examination-style questions following Nigerian secondary school and university entrance exam standards
      </p>



      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-2xl border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subjects
            </label>
            <select
              name="topic"
              value={formData.topic}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0D9165] focus:border-[#0D9165]"
            >
              <option value="" className="cursor-pointer">Select a subject</option>
              <option value="Physics" className="cursor-pointer">Physics</option>
              <option value="Chemistry" className="cursor-pointer">Chemistry</option>
              <option value="Biology" className="cursor-pointer">Biology</option>
              <option value="Mathematics" className="cursor-pointer">Mathematics</option>
              <option value="English Language" className="cursor-pointer">English Language</option>
              <option value="Literature in English" className="cursor-pointer">Literature in English</option>
              <option value="Government" className="cursor-pointer">Government</option>
              <option value="History" className="cursor-pointer">History</option>
              <option value="Geography" className="cursor-pointer">Geography</option>
              <option value="Economics" className="cursor-pointer">Economics</option>
              <option value="Commerce" className="cursor-pointer">Commerce</option>
              <option value="Financial Accounting" className="cursor-pointer">Financial Accounting</option>
              <option value="Agricultural Science" className="cursor-pointer">Agricultural Science</option>
              <option value="Computer Science" className="cursor-pointer">Computer Science</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0D9165] focus:border-[#0D9165]"
            >
              <option value="easy" className="cursor-pointer">Easy</option>
              <option value="medium" className="cursor-pointer">Medium</option>
              <option value="hard" className="cursor-pointer">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Number of Questions
            </label>
            <input
              type="number"
              name="numQuestions"
              value={formData.numQuestions}
              onChange={handleFormChange}
              min="1"
              max="50"
              step="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0D9165] focus:border-[#0D9165]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Question Type
            </label>
            <select
              name="questionType"
              value={formData.questionType}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#0D9165] focus:border-[#0D9165]"
            >
              <option value="" className="cursor-pointer">All Types (Mixed)</option>
              <option value="multiple-choice" className="cursor-pointer">Multiple Choice</option>
              <option value="true-false" className="cursor-pointer">True/False</option>
              <option value="fill-in-the-blank" className="cursor-pointer">Fill in the Blank</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Choose File (optional)
            </label>
            <div className="mt-1">
              {/* <button
                type="button"
                onClick={() => setShowFilePopup(true)}
                className="px-4 py-2 bg-[#0D9165] text-white rounded-lg hover:bg-[#0a7a52] text-sm cursor-pointer"
              >
                Choose File
              </button> */}

              <Button size="small" text="Choose File"  onClick={() => setShowFilePopup(true)}/>
            </div>
            {selectedFileName && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {selectedFileName}
              </p>
            )}
          </div>
          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating || !formData.topic}
            className="w-full bg-[#0D9165] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-[#0a7a52] disabled:opacity-50 cursor-pointer text-sm sm:text-base"
          >
            {isGenerating ? "Generating..." : "Generate Quiz"}
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/dashboard/past-quizzes")}
            className="flex-1 bg-[#0D9165] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg cursor-pointer hover:bg-[#0a7a52] transition-colors text-sm sm:text-base"
          >
            View Past Quizzes
          </button>
          <button
            onClick={() => navigate("/dashboard/quiz-analytics")}
            className="flex-1 bg-[#0D9165] text-white px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer rounded-lg hover:bg-[#0a7a52] transition-colors text-sm sm:text-base"
          >
            View Analytics
          </button>
        </div>
      </div>

      {quizzes.length > 0 && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-[#0D9165]">
            Past Quizzes
          </h2>
          <ul className="space-y-2">
            {quizzes.map((quiz: Quiz) => (
              <li
                key={quiz._id}
                className="bg-white shadow-sm rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">{quiz.topic}</h3>
                  <p className="text-sm text-gray-500">
                    {quiz.difficulty} • {quiz.numQuestions} questions
                  </p>
                </div>
                {/* <button
                  onClick={() => handleSelectQuiz()}
                  className="bg-[#0D9165] text-white px-4 py-2 rounded-lg hover:bg-[#0a7a52] cursor-pointer"
                >
                  Take Quiz
                </button> */}
                <Button onClick={() => handleSelectQuiz()} text="Take Quiz"/>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File Selection Popup */}
      {showFilePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowFilePopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#0D9165]">
              Choose File Source
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowFilePopup(false);
                  navigate("/dashboard/upload?select=true");
                }}
                className="w-full bg-[#0D9165] text-white px-4 py-2 rounded-lg hover:bg-[#0a7a52] cursor-pointer"
              >
                Select from Uploaded Files
              </button>
              <button
                onClick={() => {
                  setShowFilePopup(false);
                  // Trigger file input click
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = ".txt,.pdf,.doc,.docx";
                  fileInput.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    const selectedFile = target.files?.[0];
                    if (selectedFile) {
                      setSelectedFileName(selectedFile.name);
                      setFormData((prev) => ({ ...prev, file: selectedFile }));
                    }
                  };
                  fileInput.click();
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 cursor-pointer"
              >
                Choose from System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSetup;
