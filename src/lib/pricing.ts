import type { Product } from "@/types";

export const getDiscountAmount = (product: Product) => {
  if (!product.discountType || !product.discountValue) return 0;

  if (product.discountType === "percentage") {
    return Math.max(0, Math.min(product.price, (product.price * product.discountValue) / 100));
  }

  return Math.max(0, Math.min(product.price, product.discountValue));
};

export const getFinalPrice = (product: Product) => {
  const discount = getDiscountAmount(product);
  return Math.max(0, Number((product.price - discount).toFixed(2)));
};
