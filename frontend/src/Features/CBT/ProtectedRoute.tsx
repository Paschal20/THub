import { Navigate } from "react-router-dom";
import React from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authToken = localStorage.getItem("authToken");
  const savedUser = localStorage.getItem("verifiedUser");

  if (!authToken || !savedUser || authToken === "undefined" || savedUser === "undefined") {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">{children}</div>
    </main>
  );
}
