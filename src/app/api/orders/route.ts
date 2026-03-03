import { NextRequest } from "next/server";
import { GUEST_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/guards";
import { ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  const guestId = request.cookies.get(GUEST_COOKIE)?.value;
  const orders = await db.readOrders();

  if (user && ["super-admin", "admin", "manager"].includes(user.role)) {
    return ok({ items: orders });
  }

  if (user) {
    return ok({ items: orders.filter((order) => order.userId === user.id) });
  }

  if (guestId) {
    return ok({ items: orders.filter((order) => order.guestId === guestId) });
  }

  return ok({ items: [] });
}
