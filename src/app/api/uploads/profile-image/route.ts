import path from "node:path";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { storeImageFile } from "@/lib/upload-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const extFromName = (name: string) => {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : "";
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail("Unauthorized", 401);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) return fail("Image file is required.", 400);
    if (!file.type.startsWith("image/")) return fail("Only image files are allowed.", 400);
    if (file.size === 0) return fail("Uploaded file is empty.", 400);
    if (file.size > MAX_FILE_SIZE) return fail("Image size must be 5MB or smaller.", 400);

    const ext = extFromName(file.name) || ".jpg";
    const renamedFile = new File([await file.arrayBuffer()], `upload${ext}`, { type: file.type });
    const url = await storeImageFile(renamedFile, "profiles");

    return ok({ url }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected upload error.";
    return fail(`Failed to upload profile image: ${message}`, 500);
  }
}
