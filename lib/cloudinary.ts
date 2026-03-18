import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export { cloudinary };

export interface UploadResult {
  publicId:  string;
  url:       string;
  secureUrl: string;
  fileName:  string;
  fileSize:  number;
  mimeType:  string;
  format:    string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",   // PSD / AI
  "image/vnd.adobe.photoshop",
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export async function uploadToCloudinary(
  file: File,
  folder: string = "rds"
): Promise<UploadResult> {
  // Validate
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: max 100 MB. Got ${(file.size / 1024 / 1024).toFixed(1)} MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({
          publicId:  result.public_id,
          url:       result.url,
          secureUrl: result.secure_url,
          fileName:  file.name,
          fileSize:  result.bytes,
          mimeType:  file.type,
          format:    result.format,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(console.error);
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(console.error);
}
