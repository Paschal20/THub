import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    TrendingUp,
    Calendar,
    Award,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Filter
} from 'lucide-react';

interface QuizAttempt {
    isCorrect: boolean;
    questionText: string;
    userAnswer?: string;
    correctAnswer: string;
    subject: string;
}

interface QuizSession {
    sessionId: string;
    date: string;
    subjects: string[];
    totalQuestions: number;
    correctAnswers: number;
    successRate: string;
    score: number;
    attempts: QuizAttempt[];
}

interface SubjectPerformance {
    subject: string;
    totalQuestions: number;
    correctAnswers: number;
    successRate: string;
    score: number;
}

interface OverallStats {
    totalQuizzesTaken: number;
    totalQuestionsAttempted: number;
    totalCorrectAnswers: number;
    overallSuccessRate: string;
}

interface User {
    _id: string;
    fullName: string;
    totalScore: number;
}

interface HistoryData {
    user: User;
    overallStats: OverallStats;
    subjectPerformance: SubjectPerformance[];
    quizSessions: QuizSession[];
}

export default function QuizHistory() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<HistoryData | null>(null);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const storedUser = localStorage.getItem("verifiedUser");
    const userId = storedUser ? JSON.parse(storedUser)?._id : null;

    useEffect(() => {
        fetchHistory();
    }, [userId, selectedSubject]);

    const fetchHistory = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const authToken = localStorage.getItem("authToken");
            let url = `/api/question/history/${userId}`;
            if (selectedSubject) {
                url += `?subject=${selectedSubject}`;
            }

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            setHistory(response.data.data);
        } catch (error: any) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSession = (sessionId: string) => {
        setExpandedSession(expandedSession === sessionId ? null : sessionId);
    };

    if (loading) {
        return (
            <div className="text-center py-10 h-[500px] justify-center flex items-center flex-col">
                <svg className="animate-spin h-10 w-10 text-emerald-700" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-2xl text-emerald-700 font-semibold">Loading History...</p>
            </div>
        );
    }

    if (!history) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-600">Unable to load quiz history.</p>
            </div>
        );
    }

    const { user, overallStats, subjectPerformance, quizSessions } = history;

    return (
        <div className="space-y-6 py-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
                        <p className="text-gray-600">{user.fullName}'s Performance Overview</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Filter by Subject:</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-emerald-500"
                        >
                            <option value="">All Subjects</option>
                            {subjectPerformance.map((subj: SubjectPerformance, idx: number) => (
                                <option key={idx} value={subj.subject}>{subj.subject}</option>
                            ))}
                        </select>
                        {selectedSubject && (
                            <button
                                onClick={() => setSelectedSubject('')}
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Overall Statistics */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-6 w-6" />
                    <h2 className="text-xl font-bold">Overall Performance</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{overallStats.totalQuizzesTaken}</div>
                        <div className="text-sm text-emerald-100">Quizzes Taken</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{overallStats.totalQuestionsAttempted}</div>
                        <div className="text-sm text-emerald-100">Questions</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{overallStats.totalCorrectAnswers}</div>
                        <div className="text-sm text-emerald-100">Correct</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{overallStats.overallSuccessRate}</div>
                        <div className="text-sm text-emerald-100">Success Rate</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold">{user.totalScore}</div>
                        <div className="text-sm text-emerald-100">Total Score</div>
                    </div>
                </div>
            </div>

            {/* Subject Performance */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-900">Performance by Subject</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectPerformance.map((subject: SubjectPerformance, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="font-semibold text-gray-900 mb-3">{subject.subject}</div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Questions:</span>
                                    <span className="font-medium">{subject.totalQuestions}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Correct:</span>
                                    <span className="font-medium text-green-600">{subject.correctAnswers}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Success Rate:</span>
                                    <span className="font-medium text-emerald-600">{subject.successRate}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Score:</span>
                                    <span className="font-medium">{subject.score}</span>
                                </div>
                            </div>
                            <div className="mt-3 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all"
                                    style={{ width: subject.successRate }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quiz Sessions */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-900">Quiz Sessions</h2>
                    <span className="text-sm text-gray-500">({quizSessions.length} sessions)</span>
                </div>
                <div className="space-y-3">
                    {quizSessions.map((session: QuizSession, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div
                                onClick={() => toggleSession(session.sessionId)}
                                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="bg-emerald-100 text-emerald-700 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {new Date(session.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {session.subjects.join(', ')}
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-sm">
                                        <div className="text-center">
                                            <div className="font-bold text-gray-900">{session.totalQuestions}</div>
                                            <div className="text-gray-500">Questions</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-green-600">{session.correctAnswers}</div>
                                            <div className="text-gray-500">Correct</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-emerald-600">{session.successRate}</div>
                                            <div className="text-gray-500">Success</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-gray-900">{session.score}</div>
                                            <div className="text-gray-500">Score</div>
                                        </div>
                                    </div>
                                </div>
                                {expandedSession === session.sessionId ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </div>

                            {expandedSession === session.sessionId && (
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <div className="space-y-2">
                                        {session.attempts.map((attempt: QuizAttempt, attemptIdx: number) => (
                                            <div
                                                key={attemptIdx}
                                                className={`p-3 rounded-lg border ${attempt.isCorrect
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {attempt.isCorrect ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900 mb-1">
                                                            {attempt.questionText}
                                                        </div>
                                                        <div className="text-sm space-y-1">
                                                            {!attempt.isCorrect && attempt.userAnswer && (
                                                                <div className="text-red-700">
                                                                    <span className="font-medium">Your answer: </span>
                                                                    {attempt.userAnswer}
                                                                </div>
                                                            )}
                                                            <div className="text-green-700">
                                                                <span className="font-medium">Correct answer: </span>
                                                                {attempt.correctAnswer}
                                                            </div>
                                                            <div className="text-gray-500 text-xs">
                                                                Subject: {attempt.subject}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
