import { useEffect, useState } from "react"
import { IoTrophyOutline } from "react-icons/io5";
import { RiAwardLine } from "react-icons/ri";
import { GoClock } from "react-icons/go";
import { IoShareSocialOutline } from "react-icons/io5";
import { GrRotateLeft } from "react-icons/gr";
import { MdKeyboardArrowRight } from "react-icons/md";

const SuccessfullPage = () => {
    const [showConfetti, setShowConfetti] = useState(false)

    // Mock quiz data - in a real app, this would come from props or context
    const quizData = {
      title: "Web Development Fundamentals",
      score: 85,
      correctAnswers: 17,
      totalQuestions: 20,
      timeTaken: "4:32",
      rank: "Expert",
    }
  
    useEffect(() => {
      // Show confetti animation when component mounts
      setShowConfetti(true)
  
      // Hide confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
  
      return () => clearTimeout(timer)
    }, [])
  
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
        {showConfetti && <Confetti />}
  
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-2">
              <IoTrophyOutline  className="h-8 w-8 text-green-600"/>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Congratulations!</h1>
            <p className="text-gray-600 mt-2">You've successfully completed the quiz</p>
          </div>
  
          <div className="border-2 border-green-200 shadow-lg">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 pb-2">
              <h2 className="text-xl font-bold text-center text-gray-800">{quizData.title}</h2>
            </div>
  
            <div className="pt-6 space-y-6">
              {/* Score display */}
              <div className="text-center">
                <div className="relative inline-block">
                  <svg className="w-32 h-32" viewBox="0 0 100 100">
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
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - 251.2 * (quizData.score / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{quizData.score}%</span>
                  </div>
                </div>
              </div>
  
              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center">
               
                    <RiAwardLine className="mr-2"/>
                    <span className="text-gray-600">Score Rank</span>
                  </div>
                  <span className="font-medium text-green-600">{quizData.rank}</span>
                </div>
  
                <div className="flex justify-between items-center py-2 border-b">
                  <div className="flex items-center">
                    
                    <GoClock className="mr-2"/>
                    <span className="text-gray-600">Time Taken</span>
                  </div>
                  <span className="font-medium">{quizData.timeTaken}</span>
                </div>
  
                <div className="py-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Accuracy</span>
                    <span className="font-medium">
                      {quizData.correctAnswers}/{quizData.totalQuestions}
                    </span>
                  </div>
                </div>
              </div>
            </div>
  
            <div className="flex flex-col gap-3 pt-2 pb-6">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center">
              <IoShareSocialOutline className='mr-2'/> Share Results
              </button>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center">
                <GrRotateLeft className='mr-2'/> Try Again
                </button>
                <button className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center">
                  Next Quiz <MdKeyboardArrowRight className="ml-2"/>
                </button>
              </div>
            </div>
          </div>
  
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">Complete 5 more quizzes to earn the "Knowledge Seeker" badge!</p>
          </div>
        </div>
      </div>
    )
}

export default SuccessfullPage;




// Simple confetti animation component
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 100 }).map((_, index) => (
        <div
          key={index}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            animationDelay: `${Math.random() * 5}s`,
            backgroundColor: ["#FFC700", "#FF0000", "#2E3191", "#41D3BD", "#0CCE6B"][Math.floor(Math.random() * 5)],
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}
    </div>
  )
}
