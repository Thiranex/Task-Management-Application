import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import "./index.css";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="spinner" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#0f172a",
            color: "#f1f5f9",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#0f172a" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#0f172a" } },
        }}
      />
    </AuthProvider>
  );
}
