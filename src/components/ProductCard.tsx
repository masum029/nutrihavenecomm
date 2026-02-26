'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
};

const getFinalPrice = (product: Product) => {
  if (!product.discountType || !product.discountValue) return product.price;
  if (product.discountType === "percentage") {
    return Number((product.price - (product.price * product.discountValue) / 100).toFixed(2));
  }
  return Math.max(0, Number((product.price - product.discountValue).toFixed(2)));
};

export default function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const finalPrice = getFinalPrice(product);
  const discountAmount = Number((product.price - finalPrice).toFixed(2));

  const addToCart = async () => {
    setLoading(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-white overflow-hidden border border-emerald-100">
      <Link href={`/product/${product.id}`} className="block relative w-full h-52 bg-emerald-50 overflow-hidden">
        <Image src={product.image} alt={product.name} fill className="object-cover" />
      </Link>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="badge bg-emerald-100 text-emerald-800">{product.category}</span>
          {product.flags.trending && <span className="badge bg-yellow-100 text-yellow-700">Trending</span>}
        </div>

        <Link href={`/product/${product.id}`} className="text-base font-semibold text-gray-900 hover:text-primary transition-colors">
          {product.name}
        </Link>

        <div className="mt-2 mb-3">
          <p className="text-lg font-bold text-primary">${finalPrice.toFixed(2)}</p>
          {discountAmount > 0 && (
            <p className="text-sm text-gray-500">
              <span className="line-through mr-2">${product.price.toFixed(2)}</span>
              Save ${discountAmount.toFixed(2)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">Stock: {product.stock}</p>
          <button
            onClick={addToCart}
            disabled={loading || product.stock <= 0}
            className="btn-primary-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Adding..." : product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
