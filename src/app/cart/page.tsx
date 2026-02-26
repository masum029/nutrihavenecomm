'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionUser = {
  id: string;
  role: "admin" | "customer";
};

type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stock: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const sessionResponse = await fetch("/api/auth/me");
    const sessionData = await sessionResponse.json();
    const currentUser = sessionData.data?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setItems([]);
      setSubTotal(0);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/cart");
    const data = await response.json();
    setItems(data.data.items ?? []);
    setSubTotal(data.data.subTotal ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (productId: string, quantity: number) => {
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    await load();
  };

  const removeItem = async (productId: string) => {
    await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
    await load();
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-10 text-gray-600">Loading cart...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-emerald-100 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold mb-3">Login Required</h1>
          <p className="text-gray-600 mb-5">Please login to access your cart and user-based data.</p>
          <Link href="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-emerald-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-3 bg-emerald-50 text-sm font-semibold">
            <p className="col-span-5">Product</p>
            <p className="col-span-2 text-center">Price</p>
            <p className="col-span-2 text-center">Qty</p>
            <p className="col-span-2 text-center">Total</p>
            <p className="col-span-1 text-right">Action</p>
          </div>

          {items.length === 0 && <p className="p-4 text-gray-600">Your cart is empty.</p>}

          {items.map((item) => (
            <div key={item.productId} className="grid grid-cols-12 gap-2 p-3 border-t items-center text-sm">
              <div className="col-span-5">
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">Stock: {item.stock}</p>
              </div>

              <p className="col-span-2 text-center">${item.unitPrice.toFixed(2)}</p>

              <div className="col-span-2 flex items-center justify-center gap-1">
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateQty(item.productId, Math.max(1, item.quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) => updateQty(item.productId, Number(event.target.value))}
                  className="w-14 border rounded px-2 py-1 text-center"
                />
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateQty(item.productId, Math.min(item.stock, item.quantity + 1))}
                >
                  +
                </button>
              </div>

              <p className="col-span-2 text-center font-medium">${item.subtotal.toFixed(2)}</p>

              <div className="col-span-1 text-right">
                <button onClick={() => removeItem(item.productId)} className="text-red-600 hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-emerald-100 rounded-xl p-5 h-fit">
          <h2 className="text-xl font-bold mb-4">Cart Summary</h2>
          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between"><span>Items</span><span>{totalItems}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>${subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-base border-t pt-2"><span>Total</span><span>${subTotal.toFixed(2)}</span></div>
          </div>

          <Link href="/checkout" className="btn-primary w-full text-center block">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
