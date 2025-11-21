// routes/ProtectedRoutes.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks/hooks";

const ProtectedRoute: React.FC = () => {
  const auth = useAppSelector((state) => state.auth);
  const location = useLocation();

 
  const isAuthenticated = !!auth.token 

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
