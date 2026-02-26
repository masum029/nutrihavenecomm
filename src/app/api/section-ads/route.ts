import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { makeId, nowIso } from "@/lib/utils";

export async function GET() {
  const items = await db.readSectionAds();
  return ok({ items });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as {
    section?: string;
    image?: string;
    offerEndsAt?: string;
  };

  const section = String(body.section ?? "").trim();
  const image = String(body.image ?? "").trim();
  const offerEndsAt = String(body.offerEndsAt ?? "").trim();

  if (!section) return fail("section is required.", 400);
  if (!image) return fail("image is required.", 400);
  if (!offerEndsAt) return fail("offerEndsAt is required.", 400);

  const endDate = new Date(offerEndsAt);
  if (Number.isNaN(endDate.getTime())) return fail("Invalid offer end date.", 400);

  const items = await db.readSectionAds();
  const now = nowIso();
  const existingIndex = items.findIndex((item) => item.section.toLowerCase() === section.toLowerCase());

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      section,
      image,
      offerEndsAt: endDate.toISOString(),
      updatedAt: now,
    };
  } else {
    items.unshift({
      id: makeId("sectionAd"),
      section,
      image,
      offerEndsAt: endDate.toISOString(),
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.writeSectionAds(items);
  return ok({ items }, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as { id?: string };
  const id = String(body.id ?? "").trim();
  if (!id) return fail("id is required.", 400);

  const items = await db.readSectionAds();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return fail("Section ad not found.", 404);

  await db.writeSectionAds(next);
  return ok({ items: next });
}
