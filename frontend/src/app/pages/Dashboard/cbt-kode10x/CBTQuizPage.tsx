import { useState, useEffect } from "react";
import axios from "axios";
import { useAppSelector } from "../../../../app/hooks/hooks";
import toast from "react-hot-toast";

export default function CBTQuizPage({ onQuizComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const auth = useAppSelector((state) => state.auth);
  const userId = auth.user?.id;
  const subject = localStorage.getItem("cbt_selectedSubject");

  useEffect(() => {
    const loadQuizState = () => {
      const storedQuestions = localStorage.getItem("cbt_quiz_questions");
      const storedIndex = localStorage.getItem("cbt_quiz_currentIndex");
      const storedAnswers = localStorage.getItem("cbt_quiz_answers");
      const storedTimeLeft = localStorage.getItem("cbt_quiz_timeLeft");

      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
        if (storedIndex) setCurrentQuestionIndex(parseInt(storedIndex, 10));
        if (storedAnswers) setAnswers(JSON.parse(storedAnswers));
        if (storedTimeLeft) setTimeLeft(parseInt(storedTimeLeft, 10));
        setLoading(false);
        return true;
      }
      return false;
    };

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        console.log("Fetching CBT questions for userId:", userId, "subject:", subject);
        const authToken = localStorage.getItem("cbt_authToken");
        const response = await axios.get(
          `https://kode10x-quiz-app-backend.onrender.com/api/question/getRandomQuestions/${subject}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        console.log("CBT questions fetched successfully:", response.data);
        const fetchedQuestions = response.data.selectedQuestions;
        setQuestions(fetchedQuestions);
        localStorage.setItem("cbt_quiz_questions", JSON.stringify(fetchedQuestions));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching CBT questions:", error);
        toast.error("Failed to load quiz questions");
        setLoading(false);
      }
    };

    if (userId && subject) {
      if (!loadQuizState()) {
        fetchQuestions();
      } else if (localStorage.getItem("cbt_quiz_questions")) {
        setLoading(false);
      }
    } else {
      console.error("User not authenticated or subject not selected.");
      setLoading(false);
    }
  }, [userId, subject]);

  useEffect(() => {
    if (questions.length > 0 && !loading) {
      localStorage.setItem("cbt_quiz_currentIndex", currentQuestionIndex.toString());
      localStorage.setItem("cbt_quiz_answers", JSON.stringify(answers));
      localStorage.setItem("cbt_quiz_timeLeft", timeLeft.toString());
    }
  }, [currentQuestionIndex, answers, timeLeft, questions, loading]);

  useEffect(() => {
    if (!loading && !isQuizCompleted && questions.length > 0) {
      if (timeLeft <= 0) {
        handleQuizComplete();
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isQuizCompleted, loading, questions, handleQuizComplete]);

  const handleAnswerSelect = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex]._id]: option,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleQuizComplete = useCallback(async () => {
    if (isQuizCompleted) return;
    setIsQuizCompleted(true);

    localStorage.removeItem("cbt_quiz_questions");
    localStorage.removeItem("cbt_quiz_currentIndex");
    localStorage.removeItem("cbt_quiz_answers");
    localStorage.removeItem("cbt_quiz_timeLeft");

    let results = null;
    const storedUser = localStorage.getItem("cbt_verifiedUser");
    const externalUserId = storedUser ? JSON.parse(storedUser)?._id : null;

    // Calculate results locally as fallback
    const totalQuestions = questions.length;
    let correctAnswers = 0;
    const details = questions.map(q => {
      const userAnswer = answers[q._id] || answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        questionText: q.questionText,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const fallbackResults = {
      totalQuestions,
      correctAnswers,
      score: correctAnswers,
      percentage,
      details
    };

    if (externalUserId) {
      const answersArray = Object.keys(answers).map(questionId => ({
        questionId: questionId,
        userAnswer: answers[questionId],
      }));

      const submitData = {
        userId: externalUserId,
        answers: answersArray,
      };

      try {
        const authToken = localStorage.getItem("cbt_authToken");
        const response = await axios.post(
          'https://kode10x-quiz-app-backend.onrender.com/api/question/submitQuiz',
          submitData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );
        console.log("CBT quiz submitted:", response.data);
        results = response.data.results || fallbackResults; // Use API results if available, else fallback
        toast.success("Quiz completed successfully!");
      } catch (error) {
        console.error("Error submitting CBT quiz:", error.response?.data || error.message);
        // Use fallback results if API fails
        results = fallbackResults;
        toast.success("Quiz completed locally!");
      }
    } else {
      console.error("External user ID not found, cannot submit quiz.");
      // Use fallback results
      results = fallbackResults;
      toast.success("Quiz completed locally!");
    }

    onQuizComplete(results);
  }, [isQuizCompleted, questions, answers, onQuizComplete]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="text-center py-10 h-[500px] justify-center flex items-center flex-col">
    <svg className="animate-spin h-10 w-10 text-emerald-700" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
    <p className="text-2xl text-emerald-700 font-semibold">Loading CBT Quiz...</p>
  </div>;

  if (!questions.length) return <div className="text-center py-10">Failed to load CBT quiz questions.</div>;
  if (!userId) return <div className="text-center py-10">Authentication error. Please log in to continue.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-lg font-medium">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="font-mono text-[25px]">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="w-full bg-emerald-100 rounded-full h-2">
        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex gap-2 overflow-x-auto py-2 px-1">
        {questions.map((q, index) => (
          <button
            key={q._id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${index === currentQuestionIndex ? "bg-emerald-600 text-white" : answers[q._id] ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{currentQuestion.questionText}</h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors
                    ${answers[currentQuestion._id] === option ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center h-5">
                    <input
                      id={`option-${index}`}
                      name={`cbt-quiz-option-${currentQuestionIndex}`}
                      type="radio"
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      checked={answers[currentQuestion._id] === option}
                      onChange={() => handleAnswerSelect(option)}
                    />
                  </div>
                  <label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg border ${currentQuestionIndex === 0 ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Previous
        </button>

        <button
          onClick={handleNextQuestion}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
          {currentQuestionIndex < questions.length - 1 && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}