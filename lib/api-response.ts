import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export const unauthorized = () => error("Unauthorized", 401);
export const forbidden    = () => error("Forbidden — insufficient permissions", 403);
export const notFound     = (resource = "Resource") => error(`${resource} not found`, 404);
export const serverError  = (msg = "Internal server error") => error(msg, 500);

// Validate required fields and return 400 if any are missing
export function requireFields(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ""
  );
  return missing.length > 0 ? `Missing required fields: ${missing.join(", ")}` : null;
}
