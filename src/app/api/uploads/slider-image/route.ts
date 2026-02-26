import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const extFromName = (name: string) => {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : "";
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) return fail("Image file is required.", 400);
  if (!file.type.startsWith("image/")) return fail("Only image files are allowed.", 400);
  if (file.size > MAX_FILE_SIZE) return fail("Image size must be 8MB or smaller.", 400);

  const ext = extFromName(file.name) || ".jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "sliders");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, safeName), buffer);

  return ok({ url: `/uploads/sliders/${safeName}` }, 201);
}
