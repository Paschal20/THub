import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetCBTQuestionsQuery, useSubmitCBTQuizKode10xMutation, useSaveCBTQuizProgressMutation, useGetCBTQuizProgressQuery } from "../../Features/auth/authApi";
import type { RootState } from "../../app/store";

interface Question {
    _id: string;
    questionText: string;
    options: string[];
}

interface Answers {
    [key: string]: string;
}

export default function QuizPage() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [timeLeft, setTimeLeft] = useState(5 * 60);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const user = useSelector((state: RootState) => state.auth.user);
    const userId = user?.id || null;
    const subject = sessionStorage.getItem("selectedSubject");

    const { data: questionsData, isLoading: questionsLoading } = useGetCBTQuestionsQuery(
        { subject: subject || "", count: 10 },
        { skip: !subject || !userId }
    );
    const { data: progressData } = useGetCBTQuizProgressQuery(
        { userId: userId || "", subject: subject || "" },
        { skip: !userId || !subject }
    );
    const [submitQuiz, { isLoading: submitLoading }] = useSubmitCBTQuizKode10xMutation();
    const [saveProgress] = useSaveCBTQuizProgressMutation();

    useEffect(() => {
        const loadQuizState = () => {
            // First try to load from database
            if (progressData?.data) {
                const progress = progressData.data;
                if (progress.questions && progress.questions.length > 0) {
                    setQuestions(progress.questions);
                    setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
                    setAnswers(progress.answers || {});
                    setTimeLeft(progress.timeLeft || 300);
                    // Also save to localStorage for immediate access
                    localStorage.setItem("quiz_questions", JSON.stringify(progress.questions));
                    localStorage.setItem("quiz_currentIndex", (progress.currentQuestionIndex || 0).toString());
                    localStorage.setItem("quiz_answers", JSON.stringify(progress.answers || {}));
                    localStorage.setItem("quiz_timeLeft", (progress.timeLeft || 300).toString());
                    return true;
                }
            }

            // Fallback to localStorage
            const storedQuestions = localStorage.getItem("quiz_questions");
            const storedIndex = localStorage.getItem("quiz_currentIndex");
            const storedAnswers = localStorage.getItem("quiz_answers");
            const storedTimeLeft = localStorage.getItem("quiz_timeLeft");

            if (storedQuestions) {
                setQuestions(JSON.parse(storedQuestions));
                if (storedIndex) setCurrentQuestionIndex(parseInt(storedIndex, 10));
                if (storedAnswers) setAnswers(JSON.parse(storedAnswers));
                if (storedTimeLeft) setTimeLeft(parseInt(storedTimeLeft, 10));
                return true;
            }
            return false;
        };

        if (userId && subject) {
            if (!loadQuizState() && questionsData?.selectedQuestions) {
                const transformedQuestions = questionsData.selectedQuestions.map(q => ({
                    _id: q._id,
                    questionText: q.question,
                    options: [q.options.A, q.options.B, q.options.C, q.options.D]
                }));
                setQuestions(transformedQuestions);
                localStorage.setItem("quiz_questions", JSON.stringify(transformedQuestions));
            }
        } else {
            if (!userId) console.error("User not authenticated.");
            if (!subject) console.error("Subject not selected.");
        }
    }, [userId, subject, questionsData, progressData]);

    const isLoading = questionsLoading || submitLoading;

    useEffect(() => {
        if (questions.length > 0 && !isLoading) {
            localStorage.setItem("quiz_currentIndex", currentQuestionIndex.toString());
            localStorage.setItem("quiz_answers", JSON.stringify(answers));
            localStorage.setItem("quiz_timeLeft", timeLeft.toString());

            // Save progress to database every 30 seconds
            const progressInterval = setInterval(saveQuizProgress, 30000);

            return () => clearInterval(progressInterval);
        }
    }, [questions, isLoading]);

    // Save progress when answers or question index changes
    useEffect(() => {
        if (questions.length > 0 && !isLoading) {
            saveQuizProgress();
        }
    }, [currentQuestionIndex, answers]);

    useEffect(() => {
        if (!isLoading && !isQuizCompleted && questions.length > 0) {
            if (timeLeft <= 0) {
                handleQuizComplete();
                return;
            }
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isQuizCompleted, isLoading, questions]);

    const saveQuizProgress = async () => {
        if (userId && subject && questions.length > 0) {
            try {
                await saveProgress({
                    userId,
                    subject,
                    currentQuestionIndex,
                    answers,
                    timeLeft,
                    questions: questions.map(q => ({ _id: q._id, questionText: q.questionText }))
                }).unwrap();
            } catch (error) {
                console.error("Failed to save quiz progress:", error);
            }
        }
    };

    const handleAnswerSelect = (option: string) => {
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

    const handleQuizComplete = async () => {
        if (isQuizCompleted) return;
        setIsQuizCompleted(true);

        // Save final progress before submitting
        await saveQuizProgress();

        localStorage.removeItem("quiz_questions");
        localStorage.removeItem("quiz_currentIndex");
        localStorage.removeItem("quiz_answers");
        localStorage.removeItem("quiz_timeLeft");
        if (userId) {
            const answersArray = Object.keys(answers).map(questionId => ({
                questionId: questionId,
                userAnswer: answers[questionId],
            }));

            const presentedQuestions = questions.map(q => q._id);

            const submitData = {
                userId: userId,
                answers: answersArray,
                presentedQuestions: presentedQuestions,
            };

            try {
                const result = await submitQuiz({
                    ...submitData,
                    subject: subject || ""
                }).unwrap();
                console.log("Quiz submitted:", result);
                navigate("/dashboard/cbt/result");
            } catch (error: any) {
                console.error("Error submitting quiz:", error);
                // Don't navigate on error
            }
        } else {
            console.error("User not authenticated, cannot submit quiz.");
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    if (isLoading) return <div className="text-center py-10  h-[500px]  justify-center flex items-center flex-col">
        <svg className="animate-spin h-10 w-10 text-emerald-700" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-2xl text-emerald-700 font-semibold">Loading Quiz...</p>
    </div>;
    if (!questions.length) return <div>Failed to load quiz questions.</div>;
    if (!userId) return <div>User authentication error. Please log in to continue.</div>;

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center ">
                <div className="text-lg font-medium ">
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

            <div className="flex gap-2  overflow-x-auto py-2 px-1">
                {questions.map((q: Question, index: number) => (
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
                    <div className="space-y-6 ">
                        <h2 className="text-xl font-semibold text-gray-900">{currentQuestion.questionText}</h2>

                        <div className="space-y-3 ">
                            {currentQuestion.options.map((option: string, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => handleAnswerSelect(option)}
                                    className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors
                                        ${answers[currentQuestion._id] === option ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"}`}
                                >
                                    <div className="flex items-center h-5">
                                        <input
                                            id={`option-${index}`}
                                            name={`quiz-option-${currentQuestionIndex}`}
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