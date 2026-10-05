import { useAuthStore } from "@/store/use-auth-store";

export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions) || [];

  /**
   * Check if user has a specific permission
   */
  const can = (permissionCode: string): boolean => {
    return permissions.includes(permissionCode);
  };

  /**
   * Check if user has AT LEAST ONE of the specified permissions
   */
  const canAny = (...permissionCodes: string[]): boolean => {
    return permissionCodes.some((code) => permissions.includes(code));
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const canAll = (...permissionCodes: string[]): boolean => {
    return permissionCodes.every((code) => permissions.includes(code));
  };

  return {
    permissions,
    can,
    canAny,
    canAll,
  };
}
