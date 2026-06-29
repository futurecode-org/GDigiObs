import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, setAccessToken, setRefreshToken, setExpiresAt, clearAuthStorage, getAccessToken, isTokenExpired, getRefreshToken } from "./api";
import type { CurrentUserResponse } from "./types";

interface AuthContextType {
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !isTokenExpired();

  const fetchUser = useCallback(async () => {
    if (!getAccessToken() || isTokenExpired()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      clearAuthStorage();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const tokenResponse = await authApi.login(username, password);
      setAccessToken(tokenResponse.access_token);
      setRefreshToken(tokenResponse.refresh_token);
      setExpiresAt(tokenResponse.expires_in);
      await fetchUser();
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(getRefreshToken() || undefined);
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}