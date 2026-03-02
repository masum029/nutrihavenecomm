'use client';

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Profile = {
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  profilePicture: string;
  role: string;
};

const emptyProfile: Profile = {
  name: "",
  email: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  profilePicture: "",
  role: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => {
        if (!response.ok) {
          window.location.href = "/login";
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return;
        setProfile(data.data?.profile ?? emptyProfile);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const uploadProfileImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads/profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Failed to upload profile image.");
        return;
      }

      const url = data.data?.url;
      if (!url) {
        setError("Upload finished but image URL missing.");
        return;
      }

      setProfile((prev) => ({ ...prev, profilePicture: url }));
    } catch {
      setError("Failed to upload profile image.");
    } finally {
      setUploading(false);
    }
  };

  const onImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadProfileImage(file);
    event.target.value = "";
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Failed to update profile.");
        return;
      }

      setProfile(data.data?.profile ?? profile);
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <form onSubmit={onSubmit} className="bg-white border border-emerald-100 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={profile.name}
            onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Full name"
            className="border rounded px-3 py-2"
            required
          />
          <input value={profile.email} disabled className="border rounded px-3 py-2 bg-gray-100" />

          <input
            value={profile.mobile}
            onChange={(event) => setProfile((prev) => ({ ...prev, mobile: event.target.value }))}
            placeholder="Mobile"
            className="border rounded px-3 py-2"
            required
          />
          <input value={profile.role} disabled className="border rounded px-3 py-2 bg-gray-100 capitalize" />

          <input
            value={profile.address}
            onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="Address"
            className="border rounded px-3 py-2 sm:col-span-2"
          />
          <input
            value={profile.city}
            onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="City"
            className="border rounded px-3 py-2"
          />
          <input
            value={profile.state}
            onChange={(event) => setProfile((prev) => ({ ...prev, state: event.target.value }))}
            placeholder="State"
            className="border rounded px-3 py-2"
          />
          <input
            value={profile.country}
            onChange={(event) => setProfile((prev) => ({ ...prev, country: event.target.value }))}
            placeholder="Country"
            className="border rounded px-3 py-2"
          />
          <input
            value={profile.postalCode}
            onChange={(event) => setProfile((prev) => ({ ...prev, postalCode: event.target.value }))}
            placeholder="Postal Code"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="border rounded p-3">
          <label className="block text-sm font-medium mb-2">Profile Picture</label>
          <input type="file" accept="image/*" onChange={onImageSelect} className="w-full border rounded px-3 py-2" />
          {uploading && <p className="text-sm text-gray-600 mt-2">Uploading image...</p>}
          {profile.profilePicture && (
            <div className="mt-3 flex items-center gap-3">
              <Image src={profile.profilePicture} alt="Profile" width={96} height={96} className="h-24 w-24 rounded-full object-cover border" />
              <p className="text-xs text-gray-500 break-all">{profile.profilePicture}</p>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button disabled={saving || uploading} className="btn-primary disabled:opacity-50">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
