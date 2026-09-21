import { useMemo, type ReactNode } from "react";

import { AuthContext, type AuthValue } from "@/lib/auth";
import type { CurrentUser, SwitchableUser } from "@/lib/types";

export function AuthProvider({
  user,
  switchableUsers,
  children,
}: {
  user: CurrentUser | null;
  switchableUsers: SwitchableUser[];
  children: ReactNode;
}) {
  const value = useMemo<AuthValue>(() => {
    const permissions = new Set(user?.permissions ?? []);
    return {
      user,
      can: (permission: string) => permissions.has(permission),
      switchableUsers,
    };
  }, [user, switchableUsers]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
