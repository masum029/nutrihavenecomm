'use client';

import { useState } from "react";

type Props = {
  productId: string;
  disabled?: boolean;
};

export default function AddToCartButton({ productId, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  const add = async () => {
    setLoading(true);
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={add}
      disabled={disabled || loading}
      className="btn-primary-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
