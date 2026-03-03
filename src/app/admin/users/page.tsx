'use client';

import { FormEvent, useEffect, useState } from "react";
import type { Role } from "@/types";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const ROLE_OPTIONS = [
  { value: "super-admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "User" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});
  const [passwordDraft, setPasswordDraft] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Failed to load users.");
      return;
    }
    setCurrentUserRole((data.data?.currentUserRole as Role | undefined) ?? null);
    setUsers(data.data?.items ?? []);
  };

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (!active) return;

      if (!response.ok) {
        setError(data.message ?? "Failed to load users.");
        return;
      }

      setCurrentUserRole((data.data?.currentUserRole as Role | undefined) ?? null);
      setUsers(data.data?.items ?? []);
    };

    void loadInitial();

    return () => {
      active = false;
    };
  }, []);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        mobile: formData.get("mobile"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    setLoading(false);

    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Failed to create user.");
      return;
    }

    event.currentTarget.reset();
    setSuccess("User created successfully.");
    await loadUsers();
  };

  const updateUser = async (id: string, payload: Record<string, unknown>, successMessage: string) => {
    setError("");
    setSuccess("");
    setActionLoadingId(id);

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Action failed.");
        return;
      }

      setSuccess(successMessage);
      await loadUsers();
    } finally {
      setActionLoadingId("");
    }
  };

  const saveRole = async (user: AdminUser) => {
    const role = roleDraft[user.id] ?? user.role;
    if (role === user.role) return;
    await updateUser(user.id, { role }, "User role updated.");
  };

  const resetPassword = async (user: AdminUser) => {
    const password = (passwordDraft[user.id] ?? "").trim();
    if (!password) {
      setError("Please enter a new password first.");
      return;
    }
    await updateUser(user.id, { password }, "Password reset successful.");
    setPasswordDraft((prev) => ({ ...prev, [user.id]: "" }));
  };

  const toggleActive = async (user: AdminUser) => {
    await updateUser(user.id, { isActive: !user.isActive }, user.isActive ? "User deactivated." : "User activated.");
  };

  const canManageSuperAdmin = currentUserRole === "super-admin";
  const roleOptions = canManageSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((item) => item.value !== "super-admin");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin User Management</h1>

      <form onSubmit={createUser} className="bg-white border border-emerald-100 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="name" required placeholder="Full name" className="border rounded px-3 py-2" />
        <input name="email" type="email" required placeholder="Email" className="border rounded px-3 py-2" />
        <input name="mobile" required placeholder="Mobile" className="border rounded px-3 py-2" />
        <input name="password" type="password" required minLength={8} placeholder="Password" className="border rounded px-3 py-2" />
        <select name="role" defaultValue="user" className="border rounded px-3 py-2">
          {roleOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <button disabled={loading} className="btn-primary disabled:opacity-50">{loading ? "Creating..." : "Create User"}</button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">{success}</p>}

      <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-8 gap-2 p-3 bg-emerald-50 text-sm font-semibold">
          <p>Name</p>
          <p>Email</p>
          <p>Mobile</p>
          <p>Role</p>
          <p>Status</p>
          <p>Reset Password</p>
          <p>Actions</p>
          <p>Created</p>
        </div>
        {users.map((user) => (
          <div key={user.id} className="grid grid-cols-8 gap-2 p-3 border-t text-sm items-center">
            <p>{user.name}</p>
            <p className="truncate">{user.email}</p>
            <p>{user.mobile}</p>
            <select
              value={roleDraft[user.id] ?? user.role}
              onChange={(event) => setRoleDraft((prev) => ({ ...prev, [user.id]: event.target.value }))}
              className="border rounded px-2 py-1"
            >
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <p className={user.isActive ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
              {user.isActive ? "Active" : "Inactive"}
            </p>
            <input
              type="password"
              value={passwordDraft[user.id] ?? ""}
              onChange={(event) => setPasswordDraft((prev) => ({ ...prev, [user.id]: event.target.value }))}
              placeholder="New password"
              className="border rounded px-2 py-1"
            />
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                className="btn bg-emerald-100 text-primary"
                onClick={() => saveRole(user)}
                disabled={actionLoadingId === user.id}
              >
                Save Role
              </button>
              <button
                type="button"
                className="btn bg-gray-100 text-gray-700"
                onClick={() => resetPassword(user)}
                disabled={actionLoadingId === user.id}
              >
                Reset Password
              </button>
              <button
                type="button"
                className={`btn ${user.isActive ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                onClick={() => toggleActive(user)}
                disabled={actionLoadingId === user.id}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
            <p>{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {users.length === 0 && <p className="p-4 text-sm text-gray-600">No users found.</p>}
      </div>
    </div>
  );
}
