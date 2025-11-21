import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaMedal, FaAward, FaArrowLeft, FaCrown, FaStar, FaUsers, FaChartLine } from "react-icons/fa";
import { useGetCBTResultsQuery } from "../../../../Features/auth/authApi";

interface LeaderboardEntry {
  userId: string;
  fullName: string;
  email: string;
  totalScore: number;
  quizzesTaken: number;
  averageScore: number;
  rank: number;
}

const CBTLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'global' | 'performance'>('global');

  // For now, we'll simulate leaderboard data since the backend might not have this endpoint yet
  // In a real implementation, you'd have a dedicated leaderboard API
  const { data: resultsData } = useGetCBTResultsQuery({ page: 1, limit: 100 });

  const results = resultsData?.data?.results || [];

  // Note: Leaderboard functionality requires user data from API
  // For now, showing basic quiz statistics
  const calculateLeaderboard = (): LeaderboardEntry[] => {
    // Return empty array since user data is not available in current API
    return [];
  };

  const leaderboard = calculateLeaderboard();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaCrown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <FaMedal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <FaMedal className="h-6 w-6 text-amber-600" />;
    return <span className="text-gray-600 font-bold text-lg">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FaTrophy className="text-yellow-500" />
                CBT Leaderboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Compete with other students and track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-2 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <FaChartLine className="h-4 w-4" />
              Global Rankings
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <FaStar className="h-4 w-4" />
              Performance Stats
            </button>
          </div>
        </div>

        {/* Global Rankings */}
        {activeTab === 'global' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaTrophy className="h-5 w-5" />
                Top Performers
              </h2>
              <p className="text-blue-100 text-sm">Ranked by total CBT quiz scores</p>
            </div>

            <div className="p-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <FaUsers className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Complete some CBT quizzes to see rankings here.
                  </p>
                  <button
                    onClick={() => navigate("/dashboard/cbt")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Take a CBT Quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 20).map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadgeColor(user.rank)}`}>
                        {getRankIcon(user.rank)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{user.fullName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.totalScore}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.quizzesTaken} quiz{user.quizzesTaken !== 1 ? 'es' : ''} • Avg: {user.averageScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <FaAward className="h-6 w-6" />
                <h2 className="text-xl font-bold">Overall Statistics</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center">
                  <div className="text-2xl font-bold">{results.length}</div>
                  <div className="text-sm text-green-100">Total Quizzes</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center">
                  <div className="text-2xl font-bold">{leaderboard.length}</div>
                  <div className="text-sm text-green-100">Active Users</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center">
                  <div className="text-2xl font-bold">
                     {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) : 0}%
                  </div>
                  <div className="text-sm text-green-100">Avg Success Rate</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm text-center">
                  <div className="text-2xl font-bold">
                     {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.timeTaken, 0) / results.length / 60) : 0}m
                  </div>
                  <div className="text-sm text-green-100">Avg Time</div>
                </div>
              </div>
            </div>

            {/* Performance Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaChartLine className="text-blue-600" />
                Performance Distribution
              </h2>
              <div className="space-y-4">
                {[
                  { range: '90-100%', label: 'Excellent', color: 'bg-green-500', count: results.filter((r) => r.percentage >= 90).length },
                  { range: '80-89%', label: 'Very Good', color: 'bg-blue-500', count: results.filter((r) => r.percentage >= 80 && r.percentage < 90).length },
                  { range: '70-79%', label: 'Good', color: 'bg-yellow-500', count: results.filter((r) => r.percentage >= 70 && r.percentage < 80).length },
                  { range: '60-69%', label: 'Fair', color: 'bg-orange-500', count: results.filter((r) => r.percentage >= 60 && r.percentage < 70).length },
                  { range: 'Below 60%', label: 'Needs Improvement', color: 'bg-red-500', count: results.filter((r) => r.percentage < 60).length }
                ].map((category) => (
                  <div key={category.range} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">{category.range}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${category.color}`}
                            style={{ width: `${results.length > 0 ? (category.count / results.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-8">{category.count}</span>
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{category.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CBTLeaderboard;