import { NextRequest } from "next/server";
import { AUTH_COOKIE, createToken, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { validateLogin } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = validateLogin(body);
  if (!parsed.ok) return fail(parsed.message, 400);

  const users = await db.readUsers();
  const user = users.find((item) => item.email === parsed.data.email);
  if (!user || user.passwordHash !== hashPassword(parsed.data.password)) {
    return fail("Invalid email or password.", 401);
  }
  if (user.isActive === false) {
    return fail("Your account is deactivated. Please contact admin.", 403);
  }

  const token = createToken({ sub: user.id, role: user.role, email: user.email });
  const response = ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
