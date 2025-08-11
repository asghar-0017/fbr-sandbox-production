import React from "react";
import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  console.log("ProtectedRoute: isAuthenticated", isAuthenticated);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center z-50 h-screen">
        <CircularProgress style={{ color: "primary" }} size={70} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
