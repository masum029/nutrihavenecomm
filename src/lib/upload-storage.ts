import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

type UploadFolder = "products" | "section-banners" | "sliders" | "profiles";

export type UploadStorageHealth = {
  ready: boolean;
  mode: "blob" | "filesystem";
  message: string;
};

const isReadOnlyFsError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  return /EROFS|read-only file system/i.test(error.message);
};

const getBlobAccessMode = () => (process.env.BLOB_STORE_ACCESS === "private" ? "private" : "public");
const getUploadStorageMode = () => {
  const mode = process.env.UPLOAD_STORAGE_MODE?.toLowerCase();
  if (mode === "local") return "local";
  if (mode === "blob") return "blob";
  return "auto";
};

export async function storeImageFile(file: File, folder: UploadFolder) {
  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

  const uploadStorageMode = getUploadStorageMode();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if ((uploadStorageMode === "blob" || uploadStorageMode === "auto") && blobToken) {
    const blobAccessMode = getBlobAccessMode();

    try {
      const blob = await put(`${folder}/${fileName}`, file, {
        access: blobAccessMode,
        addRandomSuffix: false,
        token: blobToken,
      });
      return blobAccessMode === "public" ? blob.url : blob.downloadUrl ?? blob.url;
    } catch (error) {
      if (!(error instanceof Error) || !/Cannot use public access on a private store/i.test(error.message)) {
        throw error;
      }

      const blob = await put(`${folder}/${fileName}`, file, {
        access: "private",
        addRandomSuffix: false,
        token: blobToken,
      });
      return blob.downloadUrl ?? blob.url;
    }
  }

  if (uploadStorageMode === "blob" && !blobToken) {
    throw new Error("UPLOAD_STORAGE_MODE is set to blob, but BLOB_READ_WRITE_TOKEN is missing.");
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      throw new Error(
        "Read-only filesystem in production. Configure BLOB_READ_WRITE_TOKEN for persistent uploads.",
      );
    }
    throw error;
  }
}

export async function getUploadStorageHealth(): Promise<UploadStorageHealth> {
  const uploadStorageMode = getUploadStorageMode();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if ((uploadStorageMode === "blob" || uploadStorageMode === "auto") && blobToken) {
    const blobAccessMode = getBlobAccessMode();
    return {
      ready: true,
      mode: "blob",
      message:
        blobAccessMode === "public"
          ? "Uploads are configured to use Vercel Blob storage (public mode)."
          : "Uploads are configured to use Vercel Blob storage (private mode).",
    };
  }

  if (uploadStorageMode === "blob" && !blobToken) {
    return {
      ready: false,
      mode: "blob",
      message: "UPLOAD_STORAGE_MODE is blob, but BLOB_READ_WRITE_TOKEN is missing.",
    };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  const probeFilePath = path.join(uploadDir, `.health-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tmp`);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(probeFilePath, "ok");
    await fs.unlink(probeFilePath);

    return {
      ready: true,
      mode: "filesystem",
      message: "Uploads are using local filesystem storage.",
    };
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      return {
        ready: false,
        mode: "filesystem",
        message: "Read-only filesystem detected. Set BLOB_READ_WRITE_TOKEN for production uploads.",
      };
    }

    return {
      ready: false,
      mode: "filesystem",
      message: error instanceof Error ? error.message : "Failed to verify upload storage.",
    };
  }
}
