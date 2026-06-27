import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AdminApp } from "./apps/admin/AdminApp";
import { UserApp } from "./apps/user/UserApp";
import { LoginPage } from "./apps/common/LoginPage";
import { RegisterPage } from "./apps/common/RegisterPage";
import { Skeleton } from "@/components/ui/skeleton";

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-24 h-24 rounded-full" />
      </div>
    );
  }

  const isAdmin = user?.is_super_admin || user?.is_tenant_admin || user?.roles.includes("admin");

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <div className="h-screen">
              {isAdmin ? <AdminApp onSwitch={() => {}} /> : <UserApp onSwitch={() => {}} />}
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
      </AuthProvider>
    </BrowserRouter>
  );
}