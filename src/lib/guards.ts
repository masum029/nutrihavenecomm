import { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role, User } from "@/types";

const ROLE_LEVEL: Record<Role, number> = {
  "super-admin": 4,
  admin: 3,
  manager: 2,
  user: 1,
  customer: 1,
};

export const isRoleAtLeast = (role: Role, minimum: Role) => ROLE_LEVEL[role] >= ROLE_LEVEL[minimum];

export const getCurrentUser = async (request: NextRequest): Promise<User | null> => {
  const auth = getAuthFromRequest(request);
  if (!auth) return null;
  const users = await db.readUsers();
  const user = users.find((item) => item.id === auth.sub && item.email === auth.email) ?? null;
  if (!user) return null;
  if (user.isActive === false) return null;
  return user;
};

export const requireRole = (user: User | null, role: Role) => {
  if (!user) return { ok: false as const, status: 401, message: "Unauthorized" };
  if (!isRoleAtLeast(user.role, role)) return { ok: false as const, status: 403, message: "Forbidden" };
  return { ok: true as const };
};
