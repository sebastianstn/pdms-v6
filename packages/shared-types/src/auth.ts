/** Auth-related types. */

export type Role = "arzt" | "pflege" | "admin";

export interface User {
  sub: string;
  username: string;
  email: string;
  name: string;
  roles: Role[];
}

export interface Permission {
  resource: string;
  actions: ("read" | "create" | "update" | "delete")[];
}
