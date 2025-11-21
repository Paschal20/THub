import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { School } from "lucide-react";
import type { RootState } from "../../app/store";

export default function RulesScreen() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Quiz Rules</h1>
        <p className="text-gray-600">Please read the rules carefully before starting</p>
        {user?.school && (
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-full px-4 py-2 inline-flex mx-auto mt-2">
            <School className="h-4 w-4" />
            <span className="font-medium">{user.school.name}</span>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-emerald-100">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Quiz Guidelines
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="space-y-4">
            {[
              "You will have 5 minutes to complete the entire quiz.",
              "The quiz consists of multiple-choice questions with options A, B, C, and D.",
              "You can navigate between questions using the Previous and Next buttons.",
              "Each question has only one correct answer. Select the option you believe is correct.",
            ].map((rule, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                  {index + 1}
                </div>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-emerald-100 px-6 py-4 flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/dashboard/cbt/leaderboard")}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Leaderboard
          </button>
          <button
            onClick={() => navigate("/dashboard/cbt/history")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            View History
          </button>
          <button
            onClick={() => navigate("/dashboard/cbt/subject")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-8 rounded-lg transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}