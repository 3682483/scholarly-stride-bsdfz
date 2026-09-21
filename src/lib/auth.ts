import { createContext, useContext } from "react";

import type { CurrentUser, SwitchableUser } from "@/lib/types";

export type AuthValue = {
  user: CurrentUser | null;
  /** 判断当前用户是否具备某项权限 */
  can: (permission: string) => boolean;
  /** 可切换的用户（原型阶段的身份模拟） */
  switchableUsers: SwitchableUser[];
};

export const AuthContext = createContext<AuthValue>({
  user: null,
  can: () => false,
  switchableUsers: [],
});

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
