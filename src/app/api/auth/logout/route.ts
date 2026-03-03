import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST(_request: NextRequest) {
  const response = ok({ message: "Logged out" });
  response.cookies.set(AUTH_COOKIE, "", {
    path: "/",
    expires: new Date(0),
  });
  return response;
}
