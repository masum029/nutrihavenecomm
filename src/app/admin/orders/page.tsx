'use client';

import { useEffect, useState } from "react";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
};

const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = async () => {
    const response = await fetch("/api/orders");
    const data = await response.json();
    setOrders(data.data.items ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Order Management</h1>
      <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 gap-2 p-3 bg-emerald-50 text-sm font-semibold">
          <p>Order ID</p>
          <p>Total</p>
          <p>Date</p>
          <p>Status</p>
        </div>
        {orders.map((order) => (
          <div key={order.id} className="grid grid-cols-4 gap-2 p-3 border-t text-sm items-center">
            <p className="truncate">{order.id}</p>
            <p>${order.total.toFixed(2)}</p>
            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
            <select
              value={order.status}
              onChange={(event) => updateStatus(order.id, event.target.value)}
              className="border rounded px-2 py-1"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        ))}
        {orders.length === 0 && <p className="p-4 text-sm text-gray-600">No orders yet.</p>}
      </div>
    </div>
  );
}
