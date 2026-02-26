import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/products" className="card bg-white p-6 border border-emerald-100">
          <h2 className="text-xl font-bold mb-2">Product Management</h2>
          <p className="text-gray-600">Create and maintain products, discounts, stock, and flags.</p>
        </Link>
        <Link href="/admin/orders" className="card bg-white p-6 border border-emerald-100">
          <h2 className="text-xl font-bold mb-2">Order Management</h2>
          <p className="text-gray-600">Review orders and update status workflow.</p>
        </Link>
      </div>
    </div>
  );
}
