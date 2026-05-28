import { useAuth } from "./useAuth";

export interface PermissionsHelpers {
  permissions: string[];
  has: (permission: string) => boolean;
  hasAny: (permissions: string[]) => boolean;
  hasAll: (permissions: string[]) => boolean;
}

export function usePermissions(): PermissionsHelpers {
  const { permissions, hasPermission, hasAnyPermission } = useAuth();
  return {
    permissions,
    has: hasPermission,
    hasAny: hasAnyPermission,
    hasAll: (requested: string[]) => requested.every((p) => hasPermission(p)),
  };
}
