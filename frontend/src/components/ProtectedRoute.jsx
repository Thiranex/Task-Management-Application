import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
