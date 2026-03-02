import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { makeId, nowIso } from "@/lib/utils";
import type { Role } from "@/types";

const ASSIGNABLE_ROLES: Role[] = ["super-admin", "admin", "manager", "user"];

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const users = await db.readUsers();

  return ok({
    currentUserRole: user?.role,
    items: users.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      mobile: item.mobile,
      role: item.role,
      isActive: item.isActive !== false,
      createdAt: item.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser(request);
  const roleCheck = requireRole(currentUser, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const mobile = String(body.mobile ?? "").trim();
  const password = String(body.password ?? "").trim();
  const role = String(body.role ?? "user").trim() as Role;

  if (!name || !email || !mobile || !password) {
    return fail("name, email, mobile and password are required.", 400);
  }
  if (!isEmail(email)) return fail("Invalid email format.", 400);
  if (password.length < 8) return fail("Password must be at least 8 characters.", 400);
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return fail("Invalid role.", 400);
  }
  if (role === "super-admin" && currentUser?.role !== "super-admin") {
    return fail("Only Super Admin can assign Super Admin role.", 403);
  }

  const users = await db.readUsers();
  if (users.some((item) => item.email.toLowerCase() === email)) {
    return fail("Email already registered.", 409);
  }

  const user = {
    id: makeId("usr"),
    name,
    email,
    mobile,
    passwordHash: hashPassword(password),
    role,
    isActive: true,
    createdAt: nowIso(),
  };

  await db.writeUsers([...users, user]);

  return ok(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isActive: true,
      createdAt: user.createdAt,
    },
    201
  );
}

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser(request);
  const roleCheck = requireRole(currentUser, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "").trim();
  const nextRoleRaw = body.role;
  const nextPasswordRaw = body.password;
  const nextActiveRaw = body.isActive;

  if (!id) return fail("id is required.", 400);

  const users = await db.readUsers();
  const index = users.findIndex((item) => item.id === id);
  if (index < 0) return fail("User not found.", 404);

  const target = users[index];

  if (
    currentUser &&
    target.id === currentUser.id &&
    typeof nextActiveRaw === "boolean" &&
    nextActiveRaw === false
  ) {
    return fail("You cannot deactivate your own account.", 400);
  }

  if (
    currentUser &&
    target.id === currentUser.id &&
    typeof nextRoleRaw === "string" &&
    nextRoleRaw.trim() !== currentUser.role
  ) {
    return fail("You cannot change your own role.", 400);
  }

  const nextRole =
    typeof nextRoleRaw === "string" ? (nextRoleRaw.trim() as Role) : undefined;

  if (nextRole && !ASSIGNABLE_ROLES.includes(nextRole)) {
    return fail("Invalid role.", 400);
  }

  if (nextRole === "super-admin" && currentUser?.role !== "super-admin") {
    return fail("Only Super Admin can assign Super Admin role.", 403);
  }

  if (
    target.role === "super-admin" &&
    nextRole &&
    nextRole !== "super-admin" &&
    currentUser?.role !== "super-admin"
  ) {
    return fail("Only Super Admin can remove Super Admin role.", 403);
  }

  if (typeof nextPasswordRaw === "string" && nextPasswordRaw.trim().length > 0 && nextPasswordRaw.trim().length < 8) {
    return fail("Password must be at least 8 characters.", 400);
  }

  users[index] = {
    ...target,
    role: nextRole ?? target.role,
    passwordHash:
      typeof nextPasswordRaw === "string" && nextPasswordRaw.trim().length >= 8
        ? hashPassword(nextPasswordRaw.trim())
        : target.passwordHash,
    isActive:
      typeof nextActiveRaw === "boolean"
        ? nextActiveRaw
        : target.isActive !== false,
  };

  await db.writeUsers(users);

  const updated = users[index];
  return ok({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      mobile: updated.mobile,
      role: updated.role,
      isActive: updated.isActive !== false,
      createdAt: updated.createdAt,
    },
  });
}
