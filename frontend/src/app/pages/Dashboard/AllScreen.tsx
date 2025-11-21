import React from "react";
import { Route, Routes } from "react-router-dom";
import PageLayout from "../../Layout/PageLayout";
import MySchedule from "./MySchedule";
import AiChat from "./AiChat";

import Setting from "./Settings";
import Logout from "../AuthPages/logoutModal";
import SetReminder from "./SetReminder";
import History from "./History";
// import Homequizpage from "./quiz/Home";
import QuizSetup from "./quiz/QuizSetup";
import Quiz from "./quiz/quiz";
import PastQuizzes from "./quiz/PastQuizzes";
import QuizAnalyticsComponent from "./quiz/QuizAnalytics";

import UploadPage from "./UploadPage";
import EventManagementPage from "./EventManagementPage";

// CBT Components
import CBTRuleScreen from "../../../Features/CBTQuiz/RuleScreen";
import CBTSubjectSelection from "../../../Features/CBTQuiz/SubjectSelection";
import CBTQuizPage from "../../../Features/CBTQuiz/QuizPage";
import CBTResultPage from "../../../Features/CBTQuiz/ResultPage";
import CBTQuizHistory from "../../../Features/CBTQuiz/QuizHistory";
import CBTLeaderboard from "../../../Features/CBTQuiz/Leaderboard";
import CBTTotalResult from "../../../Features/CBTQuiz/TotalResult";


const AllScreen: React.FC = () => {
  return (
    <Routes>
      <Route element={<PageLayout />}>
        <Route index element={<MySchedule />} />
        <Route path="chat" element={<AiChat />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="upload-reminder" element={<SetReminder />} />
        <Route path="events" element={<EventManagementPage />} />

        {/* <Route path="quiz" element={<Homequizpage />} /> */}
        <Route path="quiz" element={<QuizSetup />} />
        <Route path="quizQuest" element={<Quiz />} />
        <Route path="past-quizzes" element={<PastQuizzes />} />
        <Route path="quiz-analytics" element={<QuizAnalyticsComponent />} />

        <Route path="history" element={<History />} />
        <Route path="setting" element={<Setting />} />
        <Route path="logout" element={<Logout onClose={() => {}} />} />

        {/* CBT Routes */}
        <Route path="cbt/rules" element={<CBTRuleScreen />} />
        <Route path="cbt/subject" element={<CBTSubjectSelection />} />
        <Route path="cbt/quiz" element={<CBTQuizPage />} />
        <Route path="cbt/result" element={<CBTResultPage />} />
        <Route path="cbt/history" element={<CBTQuizHistory />} />
        <Route path="cbt/leaderboard" element={<CBTLeaderboard />} />
        <Route path="cbt/total-results" element={<CBTTotalResult />} />
      </Route>
    </Routes>
  );
};

export default AllScreen;
