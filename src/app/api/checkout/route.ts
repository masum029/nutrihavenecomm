import { NextRequest } from "next/server";
import { GUEST_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { getDiscountAmount, getFinalPrice } from "@/lib/pricing";
import { makeId, nowIso } from "@/lib/utils";
import { validateCheckout } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = validateCheckout(body);
  if (!parsed.ok) return fail(parsed.message, 400);
  if (!parsed.data.paymentDone) return fail("Payment confirmation is required.", 400);

  const user = await getCurrentUser(request);
  const guestId = request.cookies.get(GUEST_COOKIE)?.value;

  const carts = await db.readCarts();
  const cartIndex = carts.findIndex((item) =>
    user ? item.userId === user.id : Boolean(guestId && item.guestId === guestId)
  );

  if (cartIndex < 0 || carts[cartIndex].items.length === 0) {
    return fail("Cart is empty.", 400);
  }

  const products = await db.readProducts();
  const cart = carts[cartIndex];

  const items = cart.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (item.quantity > product.stock) {
      throw new Error(`Not enough stock for ${product.name}`);
    }

    const unitPrice = getFinalPrice(product);
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      subtotal: Number((unitPrice * item.quantity).toFixed(2)),
    };
  });

  const subTotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const discountTotal = Number(
    cart.items
      .reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return sum;
        return sum + getDiscountAmount(product) * item.quantity;
      }, 0)
      .toFixed(2)
  );

  const order = {
    id: makeId("ord"),
    userId: user?.id,
    guestId: user ? undefined : guestId,
    items,
    subTotal,
    discountTotal,
    total: Number(subTotal.toFixed(2)),
    mobile: parsed.data.mobile,
    email: parsed.data.email,
    status: "pending" as const,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  for (const cartItem of cart.items) {
    const productIndex = products.findIndex((p) => p.id === cartItem.productId);
    if (productIndex >= 0) {
      products[productIndex].stock = Math.max(0, products[productIndex].stock - cartItem.quantity);
      products[productIndex].updatedAt = nowIso();
    }
  }

  const orders = await db.readOrders();
  await db.writeOrders([order, ...orders]);
  await db.writeProducts(products);

  carts[cartIndex].items = [];
  carts[cartIndex].updatedAt = nowIso();
  await db.writeCarts(carts);

  return ok({ orderId: order.id, status: order.status }, 201);
}
