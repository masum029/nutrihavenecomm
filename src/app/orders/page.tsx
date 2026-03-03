'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Role } from "@/types";

type Order = {
  id: string;
  status: string;
  total: number;
  mobile: string;
  createdAt: string;
};

type SessionUser = {
  id: string;
  role: Role;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((session) => {
        const currentUser = session.data?.user ?? null;
        setUser(currentUser);
        if (!currentUser) {
          setOrders([]);
          return;
        }

        return fetch("/api/orders")
          .then((response) => response.json())
          .then((data) => setOrders(data.data.items ?? []))
          .catch(() => setOrders([]));
      })
      .catch(() => {
        setUser(null);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-10 text-gray-600">Loading orders...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white border border-emerald-100 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold mb-3">Login Required</h1>
          <p className="text-gray-600 mb-5">Please login to see your orders.</p>
          <Link href="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{["super-admin", "admin", "manager"].includes(user.role) ? "All Orders" : "My Orders"}</h1>
      <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 gap-2 p-3 bg-emerald-50 font-semibold text-sm">
          <p>ID</p>
          <p>Status</p>
          <p>Total</p>
          <p>Mobile</p>
          <p>Date</p>
        </div>
        {orders.map((order) => (
          <div key={order.id} className="grid grid-cols-5 gap-2 p-3 border-t text-sm">
            <p className="truncate">{order.id}</p>
            <p className="capitalize">{order.status}</p>
            <p>${order.total.toFixed(2)}</p>
            <p>{order.mobile}</p>
            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="p-4 text-gray-600">No orders found.</p>}
      </div>
    </div>
  );
}
