import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { AdminApp } from "./apps/admin/AdminApp";
import { UserApp } from "./apps/user/UserApp";
import { LoginPage } from "./apps/common/LoginPage";
import { RegisterPage } from "./apps/common/RegisterPage";
import { Skeleton } from "@/components/ui/skeleton";

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [appMode, setAppMode] = useState<"admin" | "user">("admin");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-24 h-24 rounded-full" />
      </div>
    );
  }

  const isAdmin = user?.is_super_admin || user?.is_tenant_admin || user?.roles.includes("admin");

  // 非管理员用户只能看到用户端
  const currentApp = isAdmin ? appMode : "user";

  const handleSwitch = () => {
    setAppMode(prev => prev === "admin" ? "user" : "admin");
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <div className="h-screen">
              {currentApp === "admin" ? (
                <AdminApp onSwitch={isAdmin ? handleSwitch : undefined} />
              ) : (
                <UserApp onSwitch={isAdmin ? handleSwitch : undefined} />
              )}
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}