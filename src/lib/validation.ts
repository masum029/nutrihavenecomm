import { toNumber, toPositiveInt } from "@/lib/utils";
import type { DiscountType } from "@/types";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isMobile = (value: string) => /^[0-9+\-\s]{8,20}$/.test(value.trim());

export const validateRegister = (input: Record<string, unknown>): ValidationResult<{
  name: string;
  email: string;
  mobile: string;
  password: string;
}> => {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const mobile = String(input.mobile ?? "").trim();
  const password = String(input.password ?? "").trim();

  if (!name || !email || !mobile || !password) {
    return { ok: false, message: "name, email, mobile and password are required." };
  }
  if (!isEmail(email)) return { ok: false, message: "Invalid email format." };
  if (!isMobile(mobile)) return { ok: false, message: "Invalid mobile number." };
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };

  return { ok: true, data: { name, email, mobile, password } };
};

export const validateLogin = (input: Record<string, unknown>): ValidationResult<{ email: string; password: string }> => {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "").trim();

  if (!email || !password) return { ok: false, message: "email and password are required." };
  if (!isEmail(email)) return { ok: false, message: "Invalid email format." };
  return { ok: true, data: { email, password } };
};

export const validateProductInput = (input: Record<string, unknown>) => {
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const category = String(input.category ?? "").trim();
  const subcategory = String(input.subcategory ?? "").trim();
  const brand = String(input.brand ?? "").trim();
  const image = String(input.image ?? "").trim();
  const price = toNumber(input.price, NaN);
  const stock = toPositiveInt(input.stock, 0);
  const discountType = input.discountType as DiscountType | undefined;
  const discountValue = toNumber(input.discountValue, 0);

  if (!name || !description || !category || !subcategory || !brand || !image) {
    return { ok: false as const, message: "name, description, category, subcategory, brand and image are required." };
  }
  if (!Number.isFinite(price) || price <= 0) return { ok: false as const, message: "price must be a positive number." };
  if (stock < 0) return { ok: false as const, message: "stock cannot be negative." };
  if (discountType && discountType !== "percentage" && discountType !== "fixed") {
    return { ok: false as const, message: "discountType must be percentage or fixed." };
  }
  if (discountType && discountValue < 0) {
    return { ok: false as const, message: "discountValue cannot be negative." };
  }

  return {
    ok: true as const,
    data: {
      name,
      description,
      category,
      subcategory,
      brand,
      image,
      price,
      stock,
      discountType,
      discountValue,
      flags: {
        trending: Boolean((input.flags as Record<string, unknown> | undefined)?.trending),
        ramadanExclusive: Boolean((input.flags as Record<string, unknown> | undefined)?.ramadanExclusive),
        bestSell: Boolean((input.flags as Record<string, unknown> | undefined)?.bestSell),
      },
    },
  };
};

export const validateCartInput = (input: Record<string, unknown>) => {
  const productId = String(input.productId ?? "").trim();
  const quantity = toPositiveInt(input.quantity, 1);
  if (!productId) return { ok: false as const, message: "productId is required." };
  return { ok: true as const, data: { productId, quantity } };
};

export const validateCheckout = (input: Record<string, unknown>) => {
  const mobile = String(input.mobile ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const paymentDone = Boolean(input.paymentDone);

  if (!mobile) return { ok: false as const, message: "mobile is required." };
  if (!isMobile(mobile)) return { ok: false as const, message: "Invalid mobile format." };
  if (email && !isEmail(email)) return { ok: false as const, message: "Invalid email format." };
  if (!paymentDone) return { ok: false as const, message: "Payment confirmation is required." };

  return { ok: true as const, data: { mobile, email: email || undefined, paymentDone } };
};
