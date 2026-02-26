import { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role, User } from "@/types";

export const getCurrentUser = async (request: NextRequest): Promise<User | null> => {
  const auth = getAuthFromRequest(request);
  if (!auth) return null;
  const users = await db.readUsers();
  return users.find((user) => user.id === auth.sub && user.email === auth.email) ?? null;
};

export const requireRole = (user: User | null, role: Role) => {
  if (!user) return { ok: false as const, status: 401, message: "Unauthorized" };
  if (user.role !== role) return { ok: false as const, status: 403, message: "Forbidden" };
  return { ok: true as const };
};
