import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/guards";
import { fail, ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Unauthorized", 401);

  return ok({
    profile: {
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      address: user.address ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      country: user.country ?? "",
      postalCode: user.postalCode ?? "",
      profilePicture: user.profilePicture ?? "",
      role: user.role,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Unauthorized", 401);

  const body = (await request.json()) as Record<string, unknown>;
  const nextName = String(body.name ?? user.name).trim();
  const nextMobile = String(body.mobile ?? user.mobile).trim();

  if (!nextName) return fail("name is required.", 400);
  if (!nextMobile) return fail("mobile is required.", 400);

  const nextProfile = {
    name: nextName,
    mobile: nextMobile,
    address: String(body.address ?? "").trim(),
    city: String(body.city ?? "").trim(),
    state: String(body.state ?? "").trim(),
    country: String(body.country ?? "").trim(),
    postalCode: String(body.postalCode ?? "").trim(),
    profilePicture: String(body.profilePicture ?? "").trim(),
  };

  const users = await db.readUsers();
  const index = users.findIndex((item) => item.id === user.id);
  if (index < 0) return fail("User not found.", 404);

  users[index] = {
    ...users[index],
    ...nextProfile,
  };

  await db.writeUsers(users);

  return ok({
    profile: {
      ...nextProfile,
      email: users[index].email,
      role: users[index].role,
    },
  });
}
