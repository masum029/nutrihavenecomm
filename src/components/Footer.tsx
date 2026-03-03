'use client';

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">🌿 NutriHeaven</h3>
            <p className="text-gray-400">Scalable nutrition commerce with secure checkout and role-based management.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-primary transition">Home</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition">Cart</Link></li>
              <li><Link href="/checkout" className="hover:text-primary transition">Checkout</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Management</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/admin" className="hover:text-primary transition">Admin Dashboard</Link></li>
              <li><Link href="/admin/products" className="hover:text-primary transition">Products</Link></li>
              <li><Link href="/admin/orders" className="hover:text-primary transition">Orders</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-gray-400 text-sm flex flex-col sm:flex-row justify-between gap-3">
          <p>© 2026 NutriHeaven. All rights reserved.</p>
          <p>SEO-optimized • Responsive • JWT secured</p>
        </div>
      </div>
    </footer>
  );
}
