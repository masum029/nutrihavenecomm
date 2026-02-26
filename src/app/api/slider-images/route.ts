import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { makeId, nowIso } from "@/lib/utils";

export async function GET() {
  const items = await db.readSliderImages();
  return ok({ items });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as { image?: string };
  const image = String(body.image ?? "").trim();
  if (!image) return fail("image is required.", 400);

  const items = await db.readSliderImages();
  const next = [{ id: makeId("slide"), image, createdAt: nowIso() }, ...items];
  await db.writeSliderImages(next);
  return ok({ items: next }, 201);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as { id?: string };
  const id = String(body.id ?? "").trim();
  if (!id) return fail("id is required.", 400);

  const items = await db.readSliderImages();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return fail("Slider image not found.", 404);

  await db.writeSliderImages(next);
  return ok({ items: next });
}
