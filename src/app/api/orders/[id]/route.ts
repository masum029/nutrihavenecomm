import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { nowIso } from "@/lib/utils";
import type { OrderStatus } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Params) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as { status?: OrderStatus };
  const { id } = await context.params;

  const allowed: OrderStatus[] = [
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!body.status || !allowed.includes(body.status)) {
    return fail("Invalid order status.", 400);
  }

  const orders = await db.readOrders();
  const index = orders.findIndex((item) => item.id === id);
  if (index < 0) return fail("Order not found.", 404);

  orders[index].status = body.status;
  orders[index].updatedAt = nowIso();
  await db.writeOrders(orders);

  return ok(orders[index]);
}
