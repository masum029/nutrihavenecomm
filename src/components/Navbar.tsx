'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Role } from "@/types";

type SessionUser = {
  id: string;
  name: string;
  role: Role;
};

type CartLine = {
  productId: string;
  name: string;
  image: string;
  stock: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type CartResponse = {
  data?: {
    items?: CartLine[];
    subTotal?: number;
  };
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);

  const loadCart = async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const json: CartResponse = await response.json();
      setCartItems(json.data?.items ?? []);
      setCartSubtotal(json.data?.subTotal ?? 0);
    } catch {
      setCartItems([]);
      setCartSubtotal(0);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.data?.user ?? null))
      .catch(() => setUser(null));

    loadCart();

    const onFocus = () => {
      loadCart();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAdminRole = user ? ["super-admin", "admin", "manager"].includes(user.role) : false;
  const isCustomerRole = user ? ["user", "customer"].includes(user.role) : false;

  const openCart = async () => {
    setIsCartOpen(true);
    setCartLoading(true);
    await loadCart();
    setCartLoading(false);
  };

  const updateItemQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
      await loadCart();
      return;
    }

    setCartLoading(true);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      await loadCart();
    } finally {
      setCartLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setCartLoading(true);
    try {
      await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
      await loadCart();
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-base font-semibold text-primary hidden sm:inline">NutriHeaven</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/" className="text-gray-700 hover:text-primary transition-colors font-medium">Home</Link>
            <Link href="/products" className="text-gray-700 hover:text-primary transition-colors font-medium">Products</Link>

            {isCustomerRole && (
              <>
                <Link href="/orders" className="text-gray-700 hover:text-primary transition-colors font-medium">My Orders</Link>
                <Link href="/profile" className="text-gray-700 hover:text-primary transition-colors font-medium">Profile</Link>
              </>
            )}

            {isAdminRole && (
              <>
                <Link href="/orders" className="text-gray-700 hover:text-primary transition-colors font-medium">All Orders</Link>
                <Link href="/admin" className="text-gray-700 hover:text-primary transition-colors font-medium">Admin</Link>
                <Link href="/profile" className="text-gray-700 hover:text-primary transition-colors font-medium">Profile</Link>
              </>
            )}

            {user ? (
              <button onClick={logout} className="btn-primary">Logout</button>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-primary transition-colors font-medium">Login</Link>
                <Link href="/register" className="btn-primary">Register</Link>
              </>
            )}

            <button
              onClick={openCart}
              className="relative p-2 rounded-lg border border-emerald-200 text-gray-700 hover:text-primary hover:border-emerald-300 transition-colors"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l1.5 9.5a2 2 0 002 1.5h8.5a2 2 0 002-1.5L21 6H7" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-xs bg-primary text-white min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={openCart}
              className="relative p-2 rounded-lg border border-emerald-200"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l1.5 9.5a2 2 0 002 1.5h8.5a2 2 0 002-1.5L21 6H7" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-xs bg-primary text-white min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-fadeInUp">
            <Link href="/" className="block py-2 text-gray-700 hover:text-primary">Home</Link>
            <Link href="/products" className="block py-2 text-gray-700 hover:text-primary">Products</Link>

            {isCustomerRole && (
              <>
                <Link href="/orders" className="block py-2 text-gray-700 hover:text-primary">My Orders</Link>
                <Link href="/profile" className="block py-2 text-gray-700 hover:text-primary">Profile</Link>
              </>
            )}

            {isAdminRole && (
              <>
                <Link href="/orders" className="block py-2 text-gray-700 hover:text-primary">All Orders</Link>
                <Link href="/admin" className="block py-2 text-gray-700 hover:text-primary">Admin</Link>
                <Link href="/profile" className="block py-2 text-gray-700 hover:text-primary">Profile</Link>
              </>
            )}

            {user ? (
              <button onClick={logout} className="w-full btn-primary">Logout</button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href="/login" className="btn bg-emerald-100 text-primary">Login</Link>
                <Link href="/register" className="btn-primary text-center">Register</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {isCartOpen && (
        <>
          <button
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart drawer"
          />
          <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h2 className="text-lg font-semibold">Your Cart</h2>
              <button
                className="p-2 rounded-lg hover:bg-emerald-50"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cartLoading && <p className="text-sm text-gray-500">Loading cart...</p>}

              {!cartLoading && cartItems.length === 0 && (
                <p className="text-sm text-gray-600">Your cart is empty.</p>
              )}

              {!cartLoading && cartItems.map((item) => (
                <div key={item.productId} className="border border-emerald-100 rounded-xl p-3">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">${item.unitPrice.toFixed(2)} each</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 rounded-lg border border-emerald-200"
                        onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                        disabled={cartLoading}
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        className="w-8 h-8 rounded-lg border border-emerald-200"
                        onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                        disabled={cartLoading || item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">${item.subtotal.toFixed(2)}</p>
                      <button
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => removeItem(item.productId)}
                        disabled={cartLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-emerald-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold text-lg text-primary">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={() => setIsCartOpen(false)} className="btn bg-emerald-100 text-primary text-center">
                  View Cart
                </Link>
                <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="btn-primary text-center">
                  Checkout
                </Link>
              </div>
            </div>
          </aside>
        </>
      )}
    </nav>
  );
}
