import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ok, unauthorized, error, serverError } from "@/lib/api-response";
import { auditLog } from "@/lib/audit";

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "webp", "pdf", "psd", "ai", "zip",
]);

/** POST /api/upload — Upload a file to Cloudinary */
export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session) return unauthorized();

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const folder   = (formData.get("folder") as string) ?? "rds/uploads";

    if (!file) return error("No file provided");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return error(`File type .${ext} is not allowed`);
    }

    const MAX_MB = 100;
    if (file.size > MAX_MB * 1024 * 1024) {
      return error(`File exceeds ${MAX_MB}MB limit`);
    }

    const result = await uploadToCloudinary(file, folder);

    await auditLog({
      performedBy: session.user.id,
      action:      "FILE_UPLOADED",
      metadata: {
        fileName: result.fileName,
        fileSize: result.fileSize,
        folder,
        publicId: result.publicId,
      },
    });

    return ok({
      publicId:  result.publicId,
      url:       result.secureUrl,
      fileName:  result.fileName,
      fileSize:  result.fileSize,
      mimeType:  result.mimeType,
    });
  } catch (err: any) {
    console.error("[POST /api/upload]", err);
    return serverError(err?.message ?? "Upload failed");
  }
}
