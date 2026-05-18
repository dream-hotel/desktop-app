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
      console.log("[AuthContext.login] authService response:", response);

      if (response.success) {
        const fallbackUser: User = {
          id: 0,
          username: request.email.split("@")[0] || request.email,
          fullName: request.email.split("@")[0] || request.email,
          role: "cliente",
          email: request.email,
        };

        const resolvedUser = response.user ?? fallbackUser;
        setUser(resolvedUser);
        console.log("[AuthContext.login] Login success. User resolved:", resolvedUser);
        return true;
      } else {
        setError(response.message);
        console.warn("[AuthContext.login] Login rejected:", response.message);
        return false;
      }
    } catch (e) {
      console.error("[AuthContext.login] Unexpected error:", e);
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
