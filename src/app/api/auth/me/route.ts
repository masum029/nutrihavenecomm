import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/guards";
import { ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  return ok({
    authenticated: Boolean(user),
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
        }
      : null,
  });
}
