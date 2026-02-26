'use client';

import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        mobile: formData.get("mobile"),
        password: formData.get("password"),
      }),
    });

    setLoading(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data.message ?? "Registration failed.");
      return;
    }

    window.location.href = "/";
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-emerald-100">
        <input name="name" required placeholder="Full name" className="w-full border rounded-lg px-3 py-2" />
        <input name="email" type="email" required placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
        <input name="mobile" required placeholder="Mobile number" className="w-full border rounded-lg px-3 py-2" />
        <input name="password" type="password" minLength={8} required placeholder="Password" className="w-full border rounded-lg px-3 py-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? "Creating..." : "Register"}</button>
      </form>
    </div>
  );
}
