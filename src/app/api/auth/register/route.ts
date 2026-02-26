import { NextRequest } from "next/server";
import { createToken, hashPassword, AUTH_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { nowIso, makeId } from "@/lib/utils";
import { validateRegister } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = validateRegister(body);
  if (!parsed.ok) return fail(parsed.message, 400);

  const users = await db.readUsers();
  if (users.some((user) => user.email === parsed.data.email)) {
    return fail("Email already registered.", 409);
  }

  const user = {
    id: makeId("usr"),
    name: parsed.data.name,
    email: parsed.data.email,
    mobile: parsed.data.mobile,
    passwordHash: hashPassword(parsed.data.password),
    role: "customer" as const,
    createdAt: nowIso(),
  };

  await db.writeUsers([...users, user]);

  const token = createToken({ sub: user.id, role: user.role, email: user.email });
  const response = ok({ id: user.id, name: user.name, email: user.email, role: user.role }, 201);
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
