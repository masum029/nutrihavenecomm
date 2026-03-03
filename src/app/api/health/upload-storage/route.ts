import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { getUploadStorageHealth } from "@/lib/upload-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) {
    return NextResponse.json({ success: false, message: roleCheck.message }, { status: roleCheck.status });
  }

  const health = await getUploadStorageHealth();
  return NextResponse.json(
    {
      success: health.ready,
      message: health.message,
      data: {
        mode: health.mode,
        ready: health.ready,
      },
    },
    { status: health.ready ? 200 : 503 },
  );
}
