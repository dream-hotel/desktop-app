import { createContext, useState, useCallback, ReactNode } from "react";
import { User } from "../types/response/AuthResponse";
import { LoginRequest } from "../types/request/LoginRequest";
import * as authService from "../service/authService";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (request: LoginRequest) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (request: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(request);
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      } else {
        setError(response.message);
        return false;
      }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
