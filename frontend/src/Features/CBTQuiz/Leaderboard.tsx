 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetCBTGlobalLeaderboardQuery,
  useGetCBTSchoolLeaderboardQuery,
  useGetCBTSchoolsLeaderboardQuery,
  useGetCBTUserRankingQuery
} from '../../Features/auth/authApi';
import type { RootState } from '../../app/store';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Users,
  ArrowLeft,
  Crown,
  Medal,
  Star
} from 'lucide-react';
//For Tolani's push2
interface Student {
  userId: string;
  rank: number;
  fullName: string;
  school?: string;
  totalScore: number;
  quizzesTaken: number;
  email: string;
}

interface School {
  schoolId: string;
  rank: number;
  schoolName: string;
  totalStudents: number;
  averageScore: number;
  totalQuizzes: number;
}



export default function Leaderboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');

  const user = useSelector((state: RootState) => state.auth.user);

  // RTK Query hooks
  const { data: globalData, isLoading: globalLoading } = useGetCBTGlobalLeaderboardQuery(
    { limit: 20 },
    { skip: activeTab !== 'global' }
  );

  const { data: schoolData, isLoading: schoolLoading } = useGetCBTSchoolLeaderboardQuery(
    { schoolId: user?.school?._id || '', limit: 10 },
    { skip: activeTab !== 'school' || !user?.school }
  );

  const { data: schoolsData, isLoading: schoolsLoading } = useGetCBTSchoolsLeaderboardQuery(
    { limit: 10 },
    { skip: activeTab !== 'schools' }
  );

  const { data: userRankingData, isLoading: userRankingLoading } = useGetCBTUserRankingQuery(
    user?.id || '',
    { skip: activeTab !== 'myRank' || !user }
  );

  // Extract data from RTK Query responses
  const globalLeaderboard = globalData?.leaderboard || [];
  const schoolLeaderboard = schoolData?.leaderboard || [];
  const schoolRankings = schoolsData?.rankings || [];
  const userRanking = userRankingData || null;

  const loading = globalLoading || schoolLoading || schoolsLoading || userRankingLoading;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-600 font-semibold">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="text-center py-10 h-[500px] justify-center flex items-center flex-col">
        <svg className="animate-spin h-10 w-10 text-emerald-700" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-2xl text-emerald-700 font-semibold">Loading Leaderboard...</p>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            </div>
            <p className="text-gray-600">Compete and see where you rank</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'global'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Global
                    </button>
                    {user?.school && (
                      <button
                        onClick={() => setActiveTab('school')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                          activeTab === 'school'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        My School
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('schools')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                        activeTab === 'schools'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Award className="h-4 w-4" />
                      Top Schools
                    </button>
                    <button
                      onClick={() => setActiveTab('myRank')}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                        activeTab === 'myRank'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      <Star className="h-4 w-4" />
                      My Rank
                    </button>
                  </div>
                </div>
          
                {/* Global Leaderboard */}
                {activeTab === 'global' && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Top Students Globally
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {globalLeaderboard.map((student: Student) => (
                          <div
                            key={student.userId}
                             className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                               student.userId === user?.id
                                 ? 'bg-emerald-50 border-emerald-300 shadow-md'
                                 : 'bg-gray-50 border-gray-200 hover:shadow-md'
                             }`}
                          >
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadgeColor(student.rank)}`}>
                              {getRankIcon(student.rank)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{student.fullName}</div>
                              <div className="text-sm text-gray-600">{student.school || 'No School'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-600">{student.totalScore}</div>
                              <div className="text-xs text-gray-500">{student.quizzesTaken} quizzes</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
          
                {/* School Leaderboard */}
                {activeTab === 'school' && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top Students in {user?.school?.name}
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {schoolLeaderboard.map((student: Student) => (
                          <div
                            key={student.userId}
                             className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                               student.userId === user?.id
                                 ? 'bg-emerald-50 border-emerald-300 shadow-md'
                                 : 'bg-gray-50 border-gray-200 hover:shadow-md'
                             }`}
                          >
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadgeColor(student.rank)}`}>
                              {getRankIcon(student.rank)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{student.fullName}</div>
                              <div className="text-sm text-gray-600">{student.email}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-600">{student.totalScore}</div>
                              <div className="text-xs text-gray-500">{student.quizzesTaken} quizzes</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
          
                {/* School Rankings */}
                {activeTab === 'schools' && (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-4">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Top Schools
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {schoolRankings.map((school: School) => (
                           <div
                             key={school.schoolId}
                              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                                school.schoolId === user?.school?._id
                                  ? 'bg-emerald-50 border-emerald-300 shadow-md'
                                  : 'bg-gray-50 border-gray-200 hover:shadow-md'
                              }`}
                          >
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getRankBadgeColor(school.rank)}`}>
                              {getRankIcon(school.rank)}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{school.schoolName}</div>
                              <div className="text-sm text-gray-600">{school.totalStudents} students</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-emerald-600">{school.averageScore}</div>
                              <div className="text-xs text-gray-500">avg score</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-700">{school.totalQuizzes}</div>
                              <div className="text-xs text-gray-500">total quizzes</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
          
                {/* My Rank */}
                {activeTab === 'myRank' && userRanking && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Global Ranking Card */}
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-6 w-6" />
                          <h3 className="text-xl font-bold">Global Ranking</h3>
                        </div>
                        <div className="text-center py-6">
                          <div className="text-6xl font-bold mb-2">#{userRanking.globalRanking.rank}</div>
                          <div className="text-emerald-100 text-lg">
                            out of {userRanking.globalRanking.totalUsers} users
                          </div>
                          <div className="mt-4 bg-white/20 rounded-full px-4 py-2 inline-block">
                            <span className="font-semibold">Top {userRanking.globalRanking.percentile}</span>
                          </div>
                        </div>
                      </div>
          
                      {/* School Ranking Card */}
                      {userRanking.schoolRanking && (
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                          <div className="flex items-center gap-2 mb-4">
                            <Users className="h-6 w-6" />
                            <h3 className="text-xl font-bold">School Ranking</h3>
                          </div>
                          <div className="text-center py-6">
                            <div className="text-6xl font-bold mb-2">#{userRanking.schoolRanking.rank}</div>
                            <div className="text-emerald-100 text-lg">
                              out of {userRanking.schoolRanking.totalStudents} students
                            </div>
                            <div className="mt-4 bg-white/20 rounded-full px-4 py-2 inline-block">
                              <span className="font-semibold">Top {userRanking.schoolRanking.percentile}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
          
                    {/* User Stats */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Your Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-emerald-600">{userRanking.user.totalScore}</div>
                          <div className="text-sm text-gray-600 mt-1">Total Score</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-emerald-600">{userRanking.user.quizzesTaken}</div>
                          <div className="text-sm text-gray-600 mt-1">Quizzes Taken</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4 text-center">
                          <div className="text-3xl font-bold text-emerald-600">
                            {userRanking.user.quizzesTaken > 0 
                              ? Math.round(userRanking.user.totalScore / userRanking.user.quizzesTaken) 
                              : 0}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Avg Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
