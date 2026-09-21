import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SectionCard, Tag } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateUserInput, User, UserStatus } from "@/lib/types";
import { createUserFn, listUsersFn, setUserStatusFn, updateUserFn } from "@/api/admin";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "用户管理 · 系统管理" },
      { name: "description", content: "维护系统用户账号、单位信息与角色分配，支持启用与停用。" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async () => await listUsersFn(),
  component: UsersPage,
});

const emptyForm = (roleId: string): CreateUserInput => ({
  name: "",
  username: "",
  email: "",
  phone: "",
  unit: "",
  subject: "",
  title: "",
  roleId,
  status: "active",
});

function UsersPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("全部");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<CreateUserInput>(() => emptyForm("teacher"));
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!data) {
    return (
      <AppShell title="用户管理" subtitle="账号 · 单位 · 角色分配">
        <SectionCard title="无访问权限">
          <p className="text-sm text-muted-foreground">
            当前登录用户没有「用户管理」权限。请使用总管理员账号，或在「角色权限」中授予该权限。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const { users, roles } = data;
  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  const list = users.filter(
    (u) =>
      (roleFilter === "全部" || u.roleId === roleFilter) &&
      (q.trim() === "" ||
        u.name.includes(q.trim()) ||
        u.username.toLowerCase().includes(q.trim().toLowerCase()) ||
        u.unit.includes(q.trim())),
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(roles[0]?.id ?? "teacher"));
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      name: user.name,
      username: user.username,
      email: user.email ?? "",
      phone: user.phone ?? "",
      unit: user.unit,
      subject: user.subject ?? "",
      title: user.title ?? "",
      roleId: user.roleId,
      status: user.status,
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof CreateUserInput>(key: K, value: CreateUserInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("请填写姓名");
      return;
    }
    if (!form.username.trim()) {
      toast.error("请填写工号（登录名）");
      return;
    }
    if (!form.unit.trim()) {
      toast.error("请填写所属单位");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateUserFn({ data: { ...form, id: editing.id } });
        toast.success(`用户「${form.name}」已更新`);
      } else {
        await createUserFn({ data: form });
        toast.success(`用户「${form.name}」已创建`);
      }
      setDialogOpen(false);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: User) => {
    const next: UserStatus = user.status === "active" ? "disabled" : "active";
    setBusyId(user.id);
    try {
      await setUserStatusFn({ data: { id: user.id, status: next } });
      toast.success(next === "active" ? `已启用「${user.name}」` : `已停用「${user.name}」`);
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;

  return (
    <AppShell
      title="用户管理"
      subtitle={`共 ${users.length} 个账号（启用 ${activeCount}）· 总管理员可在「角色权限」中调整各角色能力`}
      actions={
        <button
          onClick={openCreate}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          新增用户
        </button>
      }
    >
      <div className="card-surface mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索姓名 / 工号 / 单位"
          className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
        >
          <option value="全部">全部角色</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">共 {list.length} 条</span>
      </div>

      <SectionCard title="账号列表">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2">姓名</th>
              <th>工号</th>
              <th>所属单位</th>
              <th>角色</th>
              <th>状态</th>
              <th>最近登录</th>
              <th className="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-border/70">
                <td className="py-2.5">
                  <span className="font-medium">{u.name}</span>
                  {u.title ? (
                    <span className="ml-1.5 text-xs text-muted-foreground">{u.title}</span>
                  ) : null}
                </td>
                <td className="text-xs text-muted-foreground">{u.username}</td>
                <td className="text-xs text-muted-foreground">{u.unit}</td>
                <td>
                  <Tag tone={u.roleId === "super_admin" ? "accent" : "primary"}>
                    {roleMap.get(u.roleId) ?? u.roleId}
                  </Tag>
                </td>
                <td>
                  <Tag tone={u.status === "active" ? "ok" : "muted"}>
                    {u.status === "active" ? "启用" : "停用"}
                  </Tag>
                </td>
                <td className="text-xs text-muted-foreground">{u.lastLogin ?? "从未登录"}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded border border-border px-2 py-0.5 text-xs hover:bg-secondary"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => void toggleStatus(u)}
                      disabled={busyId === u.id}
                      className="rounded border border-border px-2 py-0.5 text-xs hover:bg-secondary disabled:opacity-50"
                    >
                      {u.status === "active" ? "停用" : "启用"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  没有匹配的用户。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `编辑用户 · ${editing.name}` : "新增用户"}</DialogTitle>
            <DialogDescription>
              角色决定该用户可访问的页面与可执行的操作，可在「角色权限」中调整。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">姓名 *</div>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">工号 / 登录名 *</div>
              <Input
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                placeholder="例如：zhouyq"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">所属单位 *</div>
              <Input
                value={form.unit}
                onChange={(e) => setField("unit", e.target.value)}
                placeholder="例如：语文教研组"
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">职称</div>
              <Input value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">邮箱</div>
              <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">手机</div>
              <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">角色 *</div>
              <select
                value={form.roleId}
                onChange={(e) => setField("roleId", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">状态</div>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value as UserStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving}
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "保存中…" : editing ? "保存修改" : "创建用户"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
