import { createContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { User } from "../types/response/AuthResponse";
import { LoginRequest } from "../types/request/LoginRequest";
import * as authService from "../service/authService";
import { onUnauthorized } from "../service/apiClient";

export interface LoginResult {
  success: boolean;
  mustChangePassword?: boolean;
  message?: string;
}

export interface AuthState {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean;
  login: (request: LoginRequest) => Promise<LoginResult>;
  logout: () => void;
  clearSessionExpired: () => void;
  changePassword: (password: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // States to hold session details temporarily if forced password change is required
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingPermissions, setPendingPermissions] = useState<string[]>([]);

  const login = useCallback(async (request: LoginRequest): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(request);
      if (response.success && response.user) {
        if (response.user.mustChangePassword) {
          setPendingUser(response.user);
          setPendingPermissions(response.permissions ?? []);
          setSessionExpired(false);
          return { success: true, mustChangePassword: true };
        } else {
          setUser(response.user);
          setPermissions(response.permissions ?? []);
          setSessionExpired(false);
          return { success: true, mustChangePassword: false };
        }
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch {
      const errMsg = "Error de conexión. Intente nuevamente.";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions([]);
    setPendingUser(null);
    setPendingPermissions([]);
    authService.logout();
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const changePassword = useCallback(async (password: string): Promise<void> => {
    await authService.changePassword(password);
    if (pendingUser) {
      setUser({ ...pendingUser, mustChangePassword: false });
      setPermissions(pendingPermissions);
      setPendingUser(null);
      setPendingPermissions([]);
    } else {
      setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
    }
  }, [pendingUser, pendingPermissions]);

  useEffect(() => {
    return onUnauthorized(() => {
      setUser((prev) => {
        if (prev) setSessionExpired(true);
        return null;
      });
      setPermissions([]);
    });
  }, []);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  // global:admin acts as a wildcard, mirroring the backend guard.
  const isGlobalAdmin = useMemo(() => permissionSet.has("global:admin"), [permissionSet]);

  const hasPermission = useCallback(
    (permission: string) => isGlobalAdmin || permissionSet.has(permission),
    [permissionSet, isGlobalAdmin],
  );

  const hasAnyPermission = useCallback(
    (requested: string[]) => isGlobalAdmin || requested.some((p) => permissionSet.has(p)),
    [permissionSet, isGlobalAdmin],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        error,
        sessionExpired,
        login,
        logout,
        clearSessionExpired,
        changePassword,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
