import { createServerFn } from "@tanstack/react-start";

import { PERMISSION_LABELS } from "@/lib/permissions";
import type { CreateUserInput, UpdateUserInput, UserStatus } from "@/lib/types";
import {
  countActiveSuperAdmins,
  createUser,
  getCurrentUser,
  listRoles,
  listUsers,
  setCurrentUserId,
  setRolePermissions,
  setUserStatus,
  updateUser,
} from "@/db/queries.server";

function can(permission: string): boolean {
  const user = getCurrentUser();
  return Boolean(user?.permissions.includes(permission));
}

function assertPermission(permission: string): void {
  if (!can(permission)) {
    throw new Error(
      `无权限执行该操作（需要「${PERMISSION_LABELS[permission] ?? permission}」权限）`,
    );
  }
}

/** 当前登录用户（含权限集合）。 */
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  return getCurrentUser();
});

/** 切换当前登录用户（原型阶段的身份模拟，正式环境应替换为统一认证）。 */
export const switchUserFn = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    return setCurrentUserId(data.id);
  });

/** 可切换的用户列表（仅返回启用状态，用于身份切换下拉）。 */
export const listSwitchableUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  return listUsers()
    .filter((u) => u.status === "active")
    .map((u) => ({ id: u.id, name: u.name, roleName: u.roleName, unit: u.unit }));
});

// ---------------------------------------------------------------- 用户管理

/** 用户列表 + 角色列表；无权限时返回 null。 */
export const listUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!can("user:manage")) return null;
  return { users: listUsers(), roles: listRoles() };
});

export const createUserFn = createServerFn({ method: "POST" })
  .validator((input: CreateUserInput) => input)
  .handler(async ({ data }) => {
    assertPermission("user:manage");
    createUser(data);
    return { users: listUsers(), roles: listRoles() };
  });

export const updateUserFn = createServerFn({ method: "POST" })
  .validator((input: UpdateUserInput) => input)
  .handler(async ({ data }) => {
    assertPermission("user:manage");
    updateUser(data);
    return { users: listUsers(), roles: listRoles() };
  });

export const setUserStatusFn = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: UserStatus }) => input)
  .handler(async ({ data }) => {
    assertPermission("user:manage");

    const me = getCurrentUser();
    if (me?.id === data.id && data.status === "disabled") {
      throw new Error("不能停用当前登录用户");
    }
    if (data.status === "disabled") {
      const target = listUsers().find((u) => u.id === data.id);
      if (target?.roleId === "super_admin" && countActiveSuperAdmins() <= 1) {
        throw new Error("系统需保留至少一名启用状态的总管理员");
      }
    }

    setUserStatus(data.id, data.status);
    return { users: listUsers(), roles: listRoles() };
  });

// ---------------------------------------------------------------- 角色权限

/** 角色列表（含权限与用户数）；无权限时返回 null。 */
export const listRolesFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!can("role:manage")) return null;
  return listRoles();
});

export const setRolePermissionsFn = createServerFn({ method: "POST" })
  .validator((input: { roleId: string; permissions: string[] }) => input)
  .handler(async ({ data }) => {
    assertPermission("role:manage");
    const updated = setRolePermissions(data.roleId, data.permissions);
    if (!updated) throw new Error("角色不存在");
    return listRoles();
  });
