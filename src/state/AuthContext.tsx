import { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { User } from "../types/response/AuthResponse";
import { LoginRequest } from "../types/request/LoginRequest";
import * as authService from "../service/authService";
import { onUnauthorized } from "../service/apiClient";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean;
  login: (request: LoginRequest) => Promise<boolean>;
  logout: () => void;
  clearSessionExpired: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const login = useCallback(async (request: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(request);
      if (response.success && response.user) {
        setUser(response.user);
        setSessionExpired(false);
        return true;
      }
      setError(response.message);
      return false;
    } catch {
      setError("Error de conexión. Intente nuevamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    authService.logout();
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  useEffect(() => {
    return onUnauthorized(() => {
      setUser((prev) => {
        if (prev) setSessionExpired(true);
        return null;
      });
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        sessionExpired,
        login,
        logout,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
