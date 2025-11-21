// App.tsx
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import NotFound from "./app/pages/NotFound";

import Login from "./app/pages/AuthPages/login";
import Signup from "./app/pages/AuthPages/signup";
import AllScreen from "./app/pages/Dashboard/AllScreen";

import LandingPage from "./app/pages/LandingPage/LandingPage";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./routes/ProtectedRoutes";
import ForgotPassword from "./app/pages/AuthPages/forgotPassword";
import ResetPassword from "./app/pages/AuthPages/ResetPassword";

// CBT Components (now integrated into main app)




const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Navigate to="/dashboard/quiz" />} />
          <Route path="/dashboard/*" element={<AllScreen />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
};

export default App;
