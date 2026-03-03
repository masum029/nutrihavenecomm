import { NextRequest } from "next/server";
import { GUEST_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { getFinalPrice } from "@/lib/pricing";
import { makeId, nowIso } from "@/lib/utils";
import { validateCartInput } from "@/lib/validation";

const resolveCartKey = async (request: NextRequest) => {
  const user = await getCurrentUser(request);
  if (user) return { user, key: user.id, type: "user" as const };

  const existingGuestId = request.cookies.get(GUEST_COOKIE)?.value;
  return {
    user: null,
    key: existingGuestId ?? makeId("guest"),
    type: "guest" as const,
  };
};

const formatCart = async (cart: { items: { productId: string; quantity: number }[] }) => {
  const products = await db.readProducts();
  const items = cart.items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const unitPrice = getFinalPrice(product);
      return {
        productId: product.id,
        name: product.name,
        image: product.image,
        stock: product.stock,
        quantity: item.quantity,
        unitPrice,
        subtotal: Number((unitPrice * item.quantity).toFixed(2)),
      };
    })
    .filter(Boolean);

  const subTotal = Number(items.reduce((sum, item) => sum + (item?.subtotal ?? 0), 0).toFixed(2));
  return { items, subTotal };
};

export async function GET(request: NextRequest) {
  const { key, type } = await resolveCartKey(request);
  const carts = await db.readCarts();

  const cart =
    carts.find((item) => (type === "user" ? item.userId === key : item.guestId === key)) ??
    ({ id: makeId("cart"), items: [] } as const);

  const data = await formatCart(cart);
  const response = ok(data);

  if (type === "guest" && !request.cookies.get(GUEST_COOKIE)?.value) {
    response.cookies.set(GUEST_COOKIE, key, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const resolved = await resolveCartKey(request);
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = validateCartInput(body);
  if (!parsed.ok) return fail(parsed.message, 400);

  const products = await db.readProducts();
  const product = products.find((item) => item.id === parsed.data.productId);
  if (!product) return fail("Product not found.", 404);
  if (parsed.data.quantity > product.stock) return fail("Requested quantity exceeds stock.", 400);

  const carts = await db.readCarts();
  const index = carts.findIndex((item) =>
    resolved.type === "user" ? item.userId === resolved.key : item.guestId === resolved.key
  );

  const target =
    index >= 0
      ? carts[index]
      : {
          id: makeId("cart"),
          userId: resolved.type === "user" ? resolved.key : undefined,
          guestId: resolved.type === "guest" ? resolved.key : undefined,
          items: [],
          updatedAt: nowIso(),
        };

  const itemIndex = target.items.findIndex((item) => item.productId === parsed.data.productId);
  if (itemIndex >= 0) {
    const newQuantity = target.items[itemIndex].quantity + parsed.data.quantity;
    if (newQuantity > product.stock) return fail("Requested quantity exceeds stock.", 400);
    target.items[itemIndex].quantity = newQuantity;
  } else {
    target.items.push(parsed.data);
  }
  target.updatedAt = nowIso();

  if (index >= 0) carts[index] = target;
  else carts.push(target);
  await db.writeCarts(carts);

  const data = await formatCart(target);
  const response = ok(data, 201);
  if (resolved.type === "guest" && !request.cookies.get(GUEST_COOKIE)?.value) {
    response.cookies.set(GUEST_COOKIE, resolved.key, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export async function PATCH(request: NextRequest) {
  const resolved = await resolveCartKey(request);
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = validateCartInput(body);
  if (!parsed.ok) return fail(parsed.message, 400);

  const carts = await db.readCarts();
  const index = carts.findIndex((item) =>
    resolved.type === "user" ? item.userId === resolved.key : item.guestId === resolved.key
  );
  if (index < 0) return fail("Cart not found.", 404);

  const products = await db.readProducts();
  const product = products.find((item) => item.id === parsed.data.productId);
  if (!product) return fail("Product not found.", 404);
  if (parsed.data.quantity > product.stock) return fail("Requested quantity exceeds stock.", 400);

  const target = carts[index];
  const itemIndex = target.items.findIndex((item) => item.productId === parsed.data.productId);
  if (itemIndex < 0) return fail("Item not found in cart.", 404);
  target.items[itemIndex].quantity = parsed.data.quantity;
  target.updatedAt = nowIso();

  carts[index] = target;
  await db.writeCarts(carts);

  return ok(await formatCart(target));
}

export async function DELETE(request: NextRequest) {
  const resolved = await resolveCartKey(request);
  const carts = await db.readCarts();
  const index = carts.findIndex((item) =>
    resolved.type === "user" ? item.userId === resolved.key : item.guestId === resolved.key
  );

  if (index < 0) return ok({ items: [], subTotal: 0 });

  const url = request.nextUrl;
  const productId = url.searchParams.get("productId");

  if (productId) {
    carts[index].items = carts[index].items.filter((item) => item.productId !== productId);
    carts[index].updatedAt = nowIso();
  } else {
    carts[index].items = [];
    carts[index].updatedAt = nowIso();
  }

  await db.writeCarts(carts);
  return ok(await formatCart(carts[index]));
}
