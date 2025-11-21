import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { MdOutlineVerified } from "react-icons/md";
import axios from "axios";

interface QuizAttempt {
  isCorrect: boolean;
}

interface User {
  _id: string;
  fullName: string;
  totalScore: number;
  quizAttempts: QuizAttempt[];
}

const TotalResult = (): React.JSX.Element => {
  const [quizResults, setQuizResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifiedUsers, setVerifiedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | null>(null);

  useEffect(() => {
    const savedVerifiedUsers =
      JSON.parse(localStorage.getItem("verifiedUsers") || "[]") || [];
    setVerifiedUsers(savedVerifiedUsers);
  }, []);

  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/all-users`
        );
        setQuizResults(response.data.data);
      } catch (error) {
        console.error("Failed to fetch quiz results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user/verify`,
        { userId }
      );

      if (response.data && !verifiedUsers.includes(userId)) {
        const updatedUsers = [...verifiedUsers, userId];
        setVerifiedUsers(updatedUsers);
        localStorage.setItem("verifiedUsers", JSON.stringify(updatedUsers));
      }
    } catch (error: any) {
      console.error(
        "Verification failed:",
        error.response?.data || error.message
      );
    }
  };

  const filteredResults = quizResults.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === "highest") {
      return b.totalScore - a.totalScore;
    } else if (sortBy === "lowest") {
      return a.totalScore - b.totalScore;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-xl font-semibold">Loading quiz results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 ">
      <div className="mb-6 flex items-center py-5 bg-white justify-between px-10">
        <input
          type="text"
          placeholder="Search by Name"
          className="shadow-sm outline-emerald-700  block w-1/3 sm:text-sm border border-gray-300 rounded-md p-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div>
          <button
            className={`bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2 ${
              sortBy === "highest" ? "opacity-75" : ""
            }`}
            onClick={() => setSortBy(sortBy === "highest" ? null : "highest")}
          >
            Sort by Highest Score
          </button>
          <button
            className={`bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              sortBy === "lowest" ? "opacity-75" : ""
            }`}
            onClick={() => setSortBy(sortBy === "lowest" ? null : "lowest")}
          >
            Sort by Lowest Score
          </button>
        </div>
      </div>

      <div className=" grid grid-cols-4 p-10 gap-8">
         {sortedResults.length === 0 ? (
      <div className="text-center col-span-4">No results found</div>
    ) : (
        sortedResults.map((user: User, index: number) => {
          const totalQuestions = user.quizAttempts?.length || 0;
          const correctAnswers = user.quizAttempts?.filter((q: QuizAttempt) => q.isCorrect).length || 0;
          const incorrectAnswers = user.quizAttempts?.filter((q: QuizAttempt) => !q.isCorrect).length || 0;
          const percentage = user.totalScore;
          const circleLength = 251.2;
          const progress = circleLength - (circleLength * percentage) / 100;

          return (
            <div
              key={index}
              onClick={() => handleVerify(user._id)}
              className="cursor-pointer  max-w-md  bg-white p-5 rounded-[10px] shadow-2xl"
            >
              <div className="text-center text-lg font-semibold flex items-center justify-center gap-1 mt-7">
                {verifiedUsers.includes(user._id) && (
                  <MdOutlineVerified fill="green" size={25} />
                )}
                Quiz Results
              </div>

              <div className="pt-2 pb-1 flex flex-col items-center">
                <h2 className="text-xl font-bold mb-1">{user.fullName}</h2>

                <div className="relative flex items-center justify-center mb-6">
                  <div className="absolute text-lg font-bold">
                    {correctAnswers * 10}
                  </div>
                  <svg className="w-20 h-20" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-green-500 transform -rotate-90 origin-center"
                      strokeWidth="10"
                      strokeDasharray={circleLength}
                      strokeDashoffset={progress}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                </div>

                <div className="w-full mb-7">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Questions Answered</span>
                    <span className="font-medium text-base">
                      {totalQuestions}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 text-green-500" size={20} />
                      <span className="text-gray-600">Correct Answers</span>
                    </div>
                    <span className="font-medium">{correctAnswers}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center">
                      <XCircle className="mr-2 text-red-500" size={20} />
                      <span className="text-gray-600">Incorrect Answers</span>
                    </div>
                    <span className="font-medium">{incorrectAnswers}</span>
                  </div>
                </div>
              </div>
{/* 
              <div className="bg-gray-100 rounded-[5px] flex justify-center py-3 mb-20">
                <p className="text-sm text-gray-500">
                  {percentage === 100
                    ? "Perfect score! Excellent work!"
                    : "Great job! Keep up the good work!"}
                </p>
              </div> */}
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};

export default TotalResult;