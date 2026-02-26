import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { nowIso, toSlug } from "@/lib/utils";
import { validateProductInput } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  const products = await db.readProducts();
  const product = products.find((item) => item.id === id || item.slug === id);
  if (!product) return fail("Product not found.", 404);
  return ok(product);
}

export async function PATCH(request: NextRequest, context: Params) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const { id } = await context.params;
  const products = await db.readProducts();
  const index = products.findIndex((item) => item.id === id || item.slug === id);
  if (index < 0) return fail("Product not found.", 404);

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = validateProductInput(body);
  if (!parsed.ok) return fail(parsed.message, 400);

  const current = products[index];
  const updated = {
    ...current,
    ...parsed.data,
    slug: toSlug(parsed.data.name),
    updatedAt: nowIso(),
  };
  products[index] = updated;
  await db.writeProducts(products);
  return ok(updated);
}

export async function DELETE(request: NextRequest, context: Params) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const { id } = await context.params;
  const products = await db.readProducts();
  const next = products.filter((item) => item.id !== id && item.slug !== id);
  if (next.length === products.length) return fail("Product not found.", 404);

  await db.writeProducts(next);
  return ok({ deleted: true });
}
