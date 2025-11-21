import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useUpdateQuizSessionMutation,
  useCompleteQuizSessionMutation,
  useStartQuizSessionMutation,
} from "../../../../Features/auth/authApi";
import type { Question } from "../../../../Features/Types/types";
import Button from "../../../../Components/Button";

interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
  type: "multiple-choice" | "true-false" | "fill-in-the-blank";
  difficulty: "easy" | "medium" | "hard";
}

interface OldQuestion {
  question: string;
  answers: { text: string; correct: boolean }[];
  explanation?: string;
}

// interface LeaderboardEntry {
//   name: string;
//   score: number;
//   date: string;
// }

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [updateQuizSession] = useUpdateQuizSessionMutation();
  const [completeQuizSession] = useCompleteQuizSessionMutation();
  const [startQuizSession] = useStartQuizSessionMutation();

  const [playerName, setPlayerName] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});


  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Smooth scroll to question
  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`question-${index}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (quizFinished) return;

      if (e.key === "ArrowLeft" && currentQuestionIndex > 0) {
        const newIndex = currentQuestionIndex - 1;
        setCurrentQuestionIndex(newIndex);
        scrollToQuestion(newIndex);
      } else if (
        e.key === "ArrowRight" &&
        currentQuestionIndex < questions.length - 1
      ) {
        const newIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(newIndex);
        scrollToQuestion(newIndex);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentQuestionIndex, questions.length, quizFinished]);

  // Progress bar component
  const ProgressBar = () => (
    <div className="fixed top-16 sm:top-0 transform w-full max-w-3xl  rounded-lg p-3 sm:p-4  mb-6 ">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-medium text-gray-700">
          Question {currentQuestionIndex + 1} of {questions.length}
        </span>
        <span className="text-xs sm:text-sm text-gray-600">
          Answered: {Object.keys(selectedAnswers).length} / {questions.length}
        </span>
      </div>
      <div className="flex space-x-0.5 sm:space-x-1">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentQuestionIndex(index);
              scrollToQuestion(index);
            }}
            className={`flex-1 h-1.5 sm:h-2 rounded transition-colors cursor-pointer ${
              index === currentQuestionIndex
                ? 'bg-blue-500'
                : selectedAnswers[index] !== undefined
                ? 'bg-[#0d9165]' // Answered questions
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            title={`Go to question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
  const [showAnswers, setShowAnswers] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");

  // Load questions from localStorage
  useEffect(() => {
    const storedQuestions = localStorage.getItem("questions");
    if (storedQuestions) {
      const parsedQuestions = JSON.parse(storedQuestions);
      // Convert old format to new format if necessary
      const convertedQuestions = parsedQuestions.map((q: unknown) => {
        if ((q as QuizQuestion).type) return q as QuizQuestion; // already new format
        // Convert old format (answers array) to new format
        const oldQ = q as OldQuestion;
        const options: { A: string; B: string; C: string; D: string } = {
          A: "",
          B: "",
          C: "",
          D: "",
        };
        let answer = "A";
        const type: "multiple-choice" | "true-false" | "fill-in-the-blank" =
          "multiple-choice";

        if (oldQ.answers) {
          // Old format with answers array
          oldQ.answers.forEach((ans, index) => {
            const key = String.fromCharCode(65 + index) as
              | "A"
              | "B"
              | "C"
              | "D";
            options[key] = ans.text;
            if (ans.correct) answer = key;
          });
        }

        return {
          question: oldQ.question,
          options,
          answer,
          explanation: oldQ.explanation || "",
          type,
          difficulty: "easy" as const,
        };
      });
      setQuestions(convertedQuestions);
    } else {
      // TODO: Handle no questions case - perhaps navigate back or show error
      toast.error("No questions found");
      navigate("/dashboard/quiz"); // Or your default page
    }
  }, [navigate]);

  // Check if player name and session exist
  useEffect(() => {
    const name = localStorage.getItem("playerName");
    const storedTotalTime = localStorage.getItem("quizTotalTime");
    const token = localStorage.getItem("quizSessionToken");

    if (!name || !token) {
      navigate("/dashboard/quiz");
    } else {
      setPlayerName(name);
      setSessionToken(token);
      if (storedTotalTime) {
        const totalTimeValue = parseInt(storedTotalTime, 10);
        setTotalTime(totalTimeValue);
        setTotalTimeLeft(totalTimeValue);
      }
      setQuizStarted(true);
    }
  }, [navigate]);

  // Set selectedIndex when question changes
  useEffect(() => {
    const answer = selectedAnswers[currentQuestionIndex];
    if (
      answer &&
      typeof answer === "string" &&
      answer.length === 1 &&
      "ABCD".includes(answer)
    ) {
      setSelectedIndex(answer.charCodeAt(0) - 65);
    } else {
      setSelectedIndex(null);
    }
  }, [currentQuestionIndex, selectedAnswers]);

  // Timer logic
  const timerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const finishQuiz = useCallback(async () => {
    // Prevent multiple completion calls
    if (isCompleting || quizFinished) {
      console.log("finishQuiz called but already completing or finished");
      return;
    }

    console.log("finishQuiz called, isCompleting:", isCompleting, "quizFinished:", quizFinished);
    setIsCompleting(true);

    // Calculate final score based on all answers
    console.log("Calculating score with selectedAnswers:", selectedAnswers);
    console.log("Questions:", questions.length);
    console.log("Questions array:", questions);
    let finalScore = 0;
    questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      const isCorrect = userAnswer === question.answer;
      console.log(`Question ${index}: user="${userAnswer}", correct="${question.answer}", types: user=${typeof userAnswer}, correct=${typeof question.answer}, match=${isCorrect}`);
      if (isCorrect) {
        finalScore += 1;
      }
    });
    console.log("Final score calculated:", finalScore);
    setScore(finalScore);

    // Complete the session on backend
    if (sessionToken) {
      // All answers are now stored in selectedAnswers (as letter keys like "A", "B", "C", "D")
      const finalAnswers: Record<number, string | number> = {};

      Object.entries(selectedAnswers).forEach(([questionIndex, answer]) => {
        finalAnswers[parseInt(questionIndex)] = answer as string;
      });

      try {
        await completeQuizSession({
          sessionToken,
          finalAnswers,
          score: finalScore,
        }).unwrap();

        toast.success("Quiz completed and results saved!");
      } catch (error) {
        console.error("Failed to complete quiz session:", error);
        toast.error("Failed to save quiz results");
      } finally {
        // Always finish the quiz UI
        setQuizFinished(true);
        setIsCompleting(false);
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } else {
      // No session token, just finish the UI
      setQuizFinished(true);
      setIsCompleting(false);
    }
  }, [
    sessionToken,
    selectedAnswers,
    questions,
    completeQuizSession,
    setQuizFinished,
    isCompleting,
    quizFinished,
  ]);

  const timerCallback = useCallback(() => {
    setTotalTimeLeft((prevTime) => {
      if (prevTime <= 1) {
        finishQuiz();
        return 0;
      }
      return prevTime - 1;
    });
  }, [finishQuiz]);

  useEffect(() => {
    if (!quizStarted || quizFinished) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Initialize totalTimeLeft when quiz starts
    if (totalTimeLeft === 0 && questions.length > 0) {
      setTotalTimeLeft(totalTime);
    }

    timerRef.current = setInterval(timerCallback, 1000) as unknown as number;

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    quizStarted,
    quizFinished,
    totalTimeLeft,
    totalTime,
    questions.length,
    timerCallback,
  ]);

  const handleAnswerSelect = (answerIndex: number) => {
   
    if (totalTimeLeft <= 0) {
      return;
    }

    const selectedOptionKey = String.fromCharCode(65 + answerIndex); // 0=A, 1=B, etc.

    console.log(`Setting answer for question ${currentQuestionIndex}: ${selectedOptionKey}`);
    setSelectedIndex(answerIndex);
    setSelectedAnswers((prev) => {
      const updatedAnswers = {
        ...prev,
        [currentQuestionIndex]: selectedOptionKey,
      };

      console.log("Updated selectedAnswers:", updatedAnswers);

   
      if (sessionToken) {
        updateQuizSession({
          sessionToken,
          updates: {
            answers: updatedAnswers,
            currentQuestionIndex,
            lastActivityAt: new Date(),
          },
        }).catch((error) => {
          console.error("Failed to update session:", error);
          // Continue with quiz even if session update fails
          toast.error("Failed to save progress, but continuing quiz", {
            duration: 2000,
          });
        });
      }

      return updatedAnswers;
    });
  };

  const handleRetakeQuiz = async () => {
    try {
      
      const quizId = localStorage.getItem("quizId");
      if (!quizId) {
        toast.error("Quiz ID not found. Please generate a new quiz.");
        navigate("/dashboard/quiz");
        return;
      }

      // Start a new quiz session
      const result = await startQuizSession({ quizId }).unwrap();

      // Reset quiz state
      console.log("Resetting quiz state for retake");
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedIndex(null);
      setSelectedAnswers({});
      setQuizFinished(false);
      setIsCompleting(false);

      // Update localStorage and state with new session data
      localStorage.setItem("quizSessionToken", result.data.sessionToken);
      setSessionToken(result.data.sessionToken);

      // Reload quiz data from persistent storage to ensure consistency
      const storedQuizData = localStorage.getItem(`quiz_${quizId}`);
      if (storedQuizData) {
        const quizData = JSON.parse(storedQuizData);
        setQuestions(quizData.questions);
        setTotalTime(quizData.totalTime);
        setTotalTimeLeft(quizData.totalTime);
        localStorage.setItem("questions", JSON.stringify(quizData.questions));
        localStorage.setItem("quizTotalTime", quizData.totalTime.toString());
      } else {
        // Fallback to API response - need to add difficulty to each question
        const questionsWithDifficulty = result.data.quiz.questions.map((q: Question) => ({
          ...q,
          difficulty: "easy" as const, 
        }));
        setQuestions(questionsWithDifficulty);
        setTotalTimeLeft(totalTime);
        localStorage.setItem("questions", JSON.stringify(questionsWithDifficulty));
        localStorage.setItem("quizTotalTime", totalTime.toString());
      }

      setQuizStarted(true);
      toast.success("Quiz restarted successfully!");
    } catch (error) {
      console.error("Failed to restart quiz:", error);
      toast.error("Failed to restart quiz. Please try again.");
    }
  };

  const handleRestartQuiz = () => {
    navigate("/dashboard/quiz");
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-amber-600 flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );
  }

  if (quizFinished) {
    const percentage =
      questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const status = percentage >= 50 ? "PASSED" : "FAILED";
    const statusColor = percentage >= 50 ? "text-green-600" : "text-red-600";
    const timeTaken = totalTime - totalTimeLeft;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    if (showAnswers) {
      return (
        <div className="max-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 max-w-6xl w-full text-left max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h1 className="lg:text-xl text-[15px] font-bold">Answers with Explanations</h1>
<Button size="small" onClick={() => setShowAnswers(false)} text={<><span className="hidden sm:inline">Back to Results</span><span className="sm:hidden">Results</span></>} />

            
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((question, index) => {
                  let userAnswerText = "";
                  let correctAnswerText = "";
                  let isUserAnswerCorrect = false;

                  const userAnswerLetter = selectedAnswers[index];
                  if (userAnswerLetter !== undefined) {
                    const optionKey = userAnswerLetter as string;
                    userAnswerText =
                      question.options[
                        optionKey as keyof typeof question.options
                      ] || "No answer";
                    correctAnswerText =
                      question.options[
                        question.answer as keyof typeof question.options
                      ] || "No answer";
                    isUserAnswerCorrect = userAnswerLetter === question.answer;
                  }

                  return (
                    <div
                      key={index}
                      className="p-3 border rounded-lg bg-gray-50"
                    >
                      <h3 className="font-semibold mb-2 text-sm">
                        {index + 1}. {question.question}
                      </h3>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm">
                          Your answer:{" "}
                          <span
                            className={
                              isUserAnswerCorrect
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            {userAnswerText}
                          </span>
                        </p>
                        <p className="text-sm">
                          Correct answer:{" "}
                          <span className="text-green-600 font-semibold">
                            {correctAnswerText}
                          </span>
                        </p>
                      </div>
                      {question.explanation && (
                        <p className="mt-2 text-gray-700 italic text-sm">
                          Explanation: {question.explanation}
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
      <div className="max-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg  shadow-lg p-6 md:p-12 max-w-md w-full text-center">
          <h1 className="lg:text-2xl text-[18px] font-bold mb-4">WAEC/NECO/JAMB Quiz Results</h1>
          <p className="lg:text-2xl text-[18px] font-bold mb-2">
            Your result:{" "}
            <span className="text-green-700">
              {score}/{questions.length} points ({percentage}%)
            </span>
          </p>
          <p className={`mb-2 font-semibold ${statusColor}`}>
            Status: {status}
          </p>
          <p className="mb-4">Time: {formattedTime}</p>
          <p className="mb-6">
            Congratulations, you've successfully{" "}
            {status === "PASSED" ? "passed" : "completed"} the test.
          </p>
           <div className="space-y-4">

 <Button  size="small" onClick={() => setShowAnswers(true)} text="Show Answers" className="w-full sm:w-auto"/>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">

               <Button  size="small" onClick={handleRetakeQuiz} text="Retake Quiz" className="w-full sm:w-auto"/>

                <Button  size="small" onClick={handleRestartQuiz} text="New Quiz" className="w-full sm:w-auto"/>

            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="h-full flex flex-col items-center w-full bg-gray-50 pt-16 sm:pt-0">
      <ProgressBar />
      <div className="flex-1 flex items-center justify-center w-full px-4 py-4 sm:py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate("/dashboard/quiz")}
                className="bg-red-500 text-white hover:bg-gray-300 cursor-pointer lg:px-2 px-4 py-2  rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Back to Quiz Setup</span>
                <span className="sm:hidden">Back</span>
              </button>
              <h2 className="lg:text-lg sm:text-[10px] font-bold text-gray-900">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h2>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6 text-gray-700 font-semibold text-sm sm:text-base">
              <span>Player: {playerName}</span>
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full sm:w-auto h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#17B883] transition-all duration-1000 ease-linear"
                style={{
                  width: `${
                    totalTime > 0 ? (totalTimeLeft / totalTime) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center bg-[#DFF6E4] text-[#17B883] rounded-full px-3 sm:px-4 py-2 text-base sm:text-lg font-bold select-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {(() => {
                const minutes = Math.floor(totalTimeLeft / 60);
                const seconds = totalTimeLeft % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
              })()}
            </div>
          </div>

          <div id={`question-${currentQuestionIndex}`} className="mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">
              {currentQuestion.question}
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {Object.entries(currentQuestion.options).map(([key, text]) => {
                if (!text || text.trim() === "") return null; // Skip empty options

                const optionIndex = key.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                const isSelected = selectedIndex === optionIndex;

                let classes =
                  "w-full text-sm md:text-base font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 text-left";

                if (isSelected) {
                  classes +=
                    " bg-[#0d9165] text-white border-[#0d9165]";
                } else {
                  classes +=
                    " bg-white text-gray-900 hover:bg-[#0d9165] hover:text-white border-gray-300";
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(optionIndex)}
                    disabled={totalTimeLeft <= 0}
                    className={classes}
                  >
                    <span className="font-semibold mr-2">{key}.</span>
                    {text}
                  </button>
                );
              })}
            </div>
           </div>

          <div className="flex justify-between items-center mt-4 gap-4">
            <button

                  className="lg:px-3 lg:py-2 px-5 py-1.5 rounded-md bg-[#0d9165] font-inter text-[white]
        hover:rounded-[30px] hover:bg-white hover:text-[#0d9165] border hover:border-[#0d9165] disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150 ease-in-out cursor-pointer"

              onClick={() => {
                // Clear any pending timeout
                if (timeoutRef.current !== null) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                }
              }}
              disabled={currentQuestionIndex === 0}
            >
              <span className="hidden sm:inline">Previous Question</span>
              <span className="sm:hidden">Previous</span>
            </button>

            <button
                 className="lg:px-3 lg:py-2 px-8 py-1.5 rounded-md bg-[#0d9165] font-inter text-[white]
        hover:rounded-[30px] hover:bg-white hover:text-[#0d9165] border hover:border-[#0d9165]
        transition-all duration-150 ease-in-out cursor-pointer"

            onClick={() => {
                // Clear any pending timeout
                if (timeoutRef.current !== null) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                if (currentQuestionIndex < questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                  finishQuiz();
                }
              }}
              disabled={quizFinished}
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  <span className="hidden sm:inline">Next Question</span>
                  <span className="sm:hidden">Next</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Finish Quiz</span>
                  <span className="sm:hidden">finish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
