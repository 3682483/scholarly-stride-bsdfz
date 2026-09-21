import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SectionCard, Tag } from "@/components/ui-bits";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { listRolesFn, setRolePermissionsFn } from "@/api/admin";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({
    meta: [
      { title: "角色权限 · 系统管理" },
      {
        name: "description",
        content: "查看系统内置角色，并按模块配置各角色可访问的页面与可执行的操作。",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async () => await listRolesFn(),
  component: RolesPage,
});

function RolesPage() {
  const roles = Route.useLoaderData();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  if (!roles) {
    return (
      <AppShell title="角色权限" subtitle="权限矩阵配置">
        <SectionCard title="无访问权限">
          <p className="text-sm text-muted-foreground">
            当前登录用户没有「角色权限」权限。请使用总管理员账号登录后再进行配置。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const selected: Role | null = roles.find((r) => r.id === selectedId) ?? roles[0] ?? null;
  const locked = selected?.id === "super_admin";

  const permissionsOf = (role: Role): string[] => draft[role.id] ?? role.permissions;

  const toggle = (role: Role, code: string) => {
    if (role.id === "super_admin") return;
    const current = permissionsOf(role);
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    setDraft((prev) => ({ ...prev, [role.id]: next }));
  };

  const toggleGroup = (role: Role, codes: string[], selectAll: boolean) => {
    if (role.id === "super_admin") return;
    const current = new Set(permissionsOf(role));
    for (const code of codes) {
      if (selectAll) current.add(code);
      else current.delete(code);
    }
    setDraft((prev) => ({ ...prev, [role.id]: [...current] }));
  };

  const save = async (role: Role) => {
    const permissions = permissionsOf(role).filter((c) => ALL_PERMISSIONS.includes(c));
    setSaving(true);
    try {
      await setRolePermissionsFn({ data: { roleId: role.id, permissions } });
      toast.success(`「${role.name}」权限已更新`, {
        description: `当前共授予 ${permissions.length} 项权限，切换身份即可验证效果。`,
      });
      setDraft((prev) => {
        const next = { ...prev };
        delete next[role.id];
        return next;
      });
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="角色权限"
      subtitle={`系统内置 ${roles.length} 个角色 · 共 ${ALL_PERMISSIONS.length} 项权限`}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="角色">
          <ul className="space-y-2">
            {roles.map((role) => {
              const count = permissionsOf(role).length;
              const dirty = Boolean(draft[role.id]);
              return (
                <li key={role.id}>
                  <button
                    onClick={() => setSelectedId(role.id)}
                    className={`w-full rounded-md border px-3 py-2.5 text-left text-sm ${
                      selected?.id === role.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.id === "super_admin" ? <Tag tone="accent">系统内置</Tag> : null}
                      {dirty ? <Tag tone="warn">未保存</Tag> : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {count} / {ALL_PERMISSIONS.length} 项权限 · {role.userCount} 名用户
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            角色决定用户可见的菜单与可执行的操作，切换左上角「当前用户」即可验证。
          </p>
        </SectionCard>

        <div className="space-y-4 xl:col-span-2">
          {selected ? (
            <SectionCard
              title={`权限配置 · ${selected.name}`}
              action={
                locked ? (
                  <Tag tone="muted">只读</Tag>
                ) : (
                  <button
                    onClick={() => void save(selected)}
                    disabled={saving || !draft[selected.id]}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "保存中…" : "保存权限"}
                  </button>
                )
              }
            >
              <p className="text-xs text-muted-foreground">{selected.description}</p>
              {locked ? (
                <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  总管理员默认拥有全部权限且不可修改，以避免误操作导致系统无人可管理。
                </p>
              ) : null}

              <div className="mt-4 space-y-4">
                {PERMISSION_GROUPS.map((group) => {
                  const codes = group.items.map((i) => i.code);
                  const current = new Set(permissionsOf(selected));
                  const checkedCount = codes.filter((c) => current.has(c)).length;
                  const allChecked = checkedCount === codes.length;
                  return (
                    <div key={group.group} className="rounded-md border border-border px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {group.group}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {checkedCount}/{codes.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() => toggleGroup(selected, codes, !allChecked)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {allChecked ? "取消全选" : "全选"}
                        </button>
                      </div>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {group.items.map((item) => (
                          <li key={item.code}>
                            <label
                              className={`flex items-start gap-2 text-sm ${
                                locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 accent-[var(--primary)]"
                                checked={current.has(item.code)}
                                disabled={locked}
                                onChange={() => toggle(selected, item.code)}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block">{item.label}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="权限配置">
              <p className="text-sm text-muted-foreground">暂无可配置的角色。</p>
            </SectionCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
