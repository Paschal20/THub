import { useEffect, useState } from "react";
import CBTLoginPage from "./CBTLoginPage";
import CBTSignupPage from "./CBTSignupPage";
import CBTRulesScreen from "./CBTRulesScreen";
import CBTSubjectSelection from "./CBTSubjectSelection";
import CBTQuizPage from "./CBTQuizPage";
import CBTResultPage from "./CBTResultPage";
import CBTLeaderboard from "./CBTLeaderboard";

function CBTScreen() {
  const [currentScreen, setCurrentScreen] = useState("auth");
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"

  const [quizResults, setQuizResults] = useState(null);

  

  // Load from localStorage on first render
  useEffect(() => {
    // Always start from auth since CBT has its own authentication
    setCurrentScreen("auth");
  }, []);

  const handleLoginSuccess = () => {
    setCurrentScreen("rules");
  };

  const handleSignupSuccess = () => {
    setAuthMode("login");
  };



  const handleStartQuiz = () => {
    localStorage.setItem("cbt_currentScreen", "subject");
    setCurrentScreen("subject");
  };

  const handleSubjectSelected = () => {
    localStorage.setItem("cbt_currentScreen", "quiz");
    setCurrentScreen("quiz");
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    // Don't save "result" as current screen since results aren't persisted
    localStorage.removeItem("cbt_currentScreen");
    setCurrentScreen("result");
  };

  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {currentScreen === "auth" && authMode === "login" && <CBTLoginPage onLoginSuccess={handleLoginSuccess} onSwitchToSignup={() => setAuthMode("signup")} />}
        {currentScreen === "auth" && authMode === "signup" && <CBTSignupPage onSignupSuccess={handleSignupSuccess} onSwitchToLogin={() => setAuthMode("login")} />}
        {currentScreen === "rules" && <CBTRulesScreen onStartQuiz={handleStartQuiz} />}
        {currentScreen === "subject" && <CBTSubjectSelection onSubjectSelected={handleSubjectSelected} />}
        {currentScreen === "quiz" && <CBTQuizPage onQuizComplete={handleQuizComplete} />}
        {currentScreen === "result" && <CBTResultPage results={quizResults} onRetakeQuiz={() => setCurrentScreen("rules")} onViewLeaderboard={() => setCurrentScreen("leaderboard")} />}
        {currentScreen === "leaderboard" && <CBTLeaderboard onBack={() => setCurrentScreen("result")} />}
      </div>
    </main>
  );
}

export default CBTScreen;