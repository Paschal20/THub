import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Trophy,
  Award,
  TrendingUp,
  Users,
  Crown,
  Medal,
  Star
} from 'lucide-react';

export default function CBTLeaderboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('global');
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [schoolLeaderboard, setSchoolLeaderboard] = useState([]);
  const [schoolRankings, setSchoolRankings] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const [loading, setLoading] = useState(false);

  const storedUser = localStorage.getItem("cbt_verifiedUser");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const authToken = localStorage.getItem("cbt_authToken");

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true);
      try {
        if (activeTab === 'global') {
          const response = await axios.get('https://kode10x-quiz-app-backend.onrender.com/api/leaderboard/global?limit=20', {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          setGlobalLeaderboard(response.data.leaderboard);
        } else if (activeTab === 'school' && user?.school) {
          const response = await axios.get(
            `https://kode10x-quiz-app-backend.onrender.com/api/leaderboard/school/${user.school._id}?limit=10`,
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
          );
          setSchoolLeaderboard(response.data.leaderboard);
        } else if (activeTab === 'schools') {
          const response = await axios.get('https://kode10x-quiz-app-backend.onrender.com/api/leaderboard/schools?limit=10', {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          setSchoolRankings(response.data.rankings);
        } else if (activeTab === 'myRank' && user) {
          const response = await axios.get(
            `https://kode10x-quiz-app-backend.onrender.com/api/leaderboard/user/${user._id}`,
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
          );
          setUserRanking(response.data.ranking);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [activeTab, authToken, user]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <Star className="h-6 w-6 text-blue-500" />;
  };

  const renderGlobalLeaderboard = () => (
    <div className="space-y-4">
      {globalLeaderboard.map((entry) => (
        <div key={entry._id} className={`flex items-center justify-between p-4 rounded-lg border ${
          index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
              {getRankIcon(entry.rank)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{entry.fullName}</h3>
              <p className="text-sm text-gray-600">{entry.school?.name || 'No School'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{entry.totalScore}</div>
            <div className="text-sm text-gray-500">points</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSchoolLeaderboard = () => (
    <div className="space-y-4">
      {schoolLeaderboard.map((entry) => (
        <div key={entry._id} className="flex items-center justify-between p-4 rounded-lg border bg-white border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
              {entry.rank}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{entry.fullName}</h3>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{entry.totalScore}</div>
            <div className="text-sm text-gray-500">points</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSchoolRankings = () => (
    <div className="space-y-4">
      {schoolRankings.map((school) => (
        <div key={school._id} className={`flex items-center justify-between p-4 rounded-lg border ${
          index < 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
              {getRankIcon(school.rank)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{school.name}</h3>
              <p className="text-sm text-gray-600">{school.totalStudents} students</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{school.averageScore}</div>
            <div className="text-sm text-gray-500">avg score</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUserRanking = () => (
    userRanking && (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getRankIcon(userRanking.rank)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Ranking</h3>
          <div className="text-6xl font-bold text-emerald-600 mb-2">#{userRanking.rank}</div>
          <div className="text-xl text-gray-700 mb-4">{userRanking.fullName}</div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{userRanking.totalScore}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{userRanking.totalQuizzes}</div>
              <div className="text-sm text-gray-600">Quizzes Taken</div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">CBT Leaderboard</h1>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-emerald-100">
        <div className="border-b border-emerald-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'global' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Trophy className="h-5 w-5 inline mr-2" />
              Global
            </button>
            {user?.school && (
              <button
                onClick={() => setActiveTab('school')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeTab === 'school' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-5 w-5 inline mr-2" />
                School
              </button>
            )}
            <button
              onClick={() => setActiveTab('schools')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'schools' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award className="h-5 w-5 inline mr-2" />
              Schools
            </button>
            <button
              onClick={() => setActiveTab('myRank')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'myRank' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="h-5 w-5 inline mr-2" />
              My Rank
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {activeTab === 'global' && renderGlobalLeaderboard()}
              {activeTab === 'school' && renderSchoolLeaderboard()}
              {activeTab === 'schools' && renderSchoolRankings()}
              {activeTab === 'myRank' && renderUserRanking()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}