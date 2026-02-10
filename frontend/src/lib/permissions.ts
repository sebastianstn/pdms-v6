/** RBAC helper: check if a role has access to a resource/action. */

type Role = "arzt" | "pflege" | "admin";
type Action = "read" | "create" | "update" | "delete";

const PERMISSIONS: Record<string, Role[]> = {
  "patients:read": ["arzt", "pflege", "admin"],
  "patients:create": ["arzt", "admin"],
  "patients:update": ["arzt", "admin"],
  "patients:delete": ["admin"],
  "vitals:read": ["arzt", "pflege", "admin"],
  "vitals:create": ["arzt", "pflege"],
  "medications:read": ["arzt", "pflege"],
  "medications:create": ["arzt"],
  "audit:read": ["admin"],
};

export function canAccess(role: Role, resource: string, action: Action): boolean {
  const key = `${resource}:${action}`;
  return PERMISSIONS[key]?.includes(role) ?? false;
}
