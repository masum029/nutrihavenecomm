'use client';

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useEffect } from "react";

type SessionUser = {
  id: string;
  role: "admin" | "customer";
};

export default function CheckoutPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => setUser(data.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: formData.get("mobile"),
        email: formData.get("email"),
        paymentDone: formData.get("paymentDone") === "on",
      }),
    });

    setLoading(false);
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Checkout failed.");
      return;
    }

    setSuccess(`Order placed successfully. Order ID: ${data.data.orderId}`);
  };

  if (authLoading) {
    return <div className="max-w-xl mx-auto py-10 px-4 text-gray-600">Checking session...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white border border-emerald-100 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold mb-3">Login Required</h1>
          <p className="text-gray-600 mb-5">Please login to checkout with your user account.</p>
          <Link href="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <form onSubmit={placeOrder} className="bg-white border border-emerald-100 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mobile (required)</label>
          <input name="mobile" required className="w-full border rounded-lg px-3 py-2" placeholder="01XXXXXXXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email (optional)</label>
          <input name="email" type="email" className="w-full border rounded-lg px-3 py-2" placeholder="you@example.com" />
        </div>
        <label className="text-sm flex items-start gap-2">
          <input name="paymentDone" type="checkbox" className="mt-1" />
          <span>I confirm payment is completed for this order.</span>
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-700 text-sm">{success}</p>}
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? "Placing order..." : "Place Order"}</button>
      </form>
    </div>
  );
}
