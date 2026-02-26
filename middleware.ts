import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "nh_auth";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";

const toBase64 = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  return normalized + (pad ? "=".repeat(4 - pad) : "");
};

const decodeBase64Url = (value: string) => {
  const base64 = toBase64(value);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const verifyJwt = async (token: string) => {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    decodeBase64Url(signature),
    new TextEncoder().encode(`${header}.${payload}`)
  );

  if (!valid) return null;
  try {
    const payloadJson = new TextDecoder().decode(decodeBase64Url(payload));
    const parsed = JSON.parse(payloadJson) as { role: string; exp: number };
    if (!parsed.exp || Date.now() / 1000 > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
};

export async function middleware(request: NextRequest) {
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  if (!isAdminPath) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyJwt(token);
  if (!payload || payload.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
