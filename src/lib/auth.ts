import crypto from "node:crypto";
import { NextRequest } from "next/server";
import type { AuthTokenPayload, Role } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_change_me";
export const AUTH_COOKIE = "nh_auth";
export const GUEST_COOKIE = "nh_guest";

const toBase64Url = (value: string) =>
  Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64").toString();
};

const sign = (input: string) =>
  crypto.createHmac("sha256", JWT_SECRET).update(input).digest("base64url");

export const hashPassword = (password: string) =>
  crypto.createHash("sha256").update(password).digest("hex");

export const createToken = (payload: Omit<AuthTokenPayload, "exp">, expiresInSec = 60 * 60 * 24 * 7) => {
  const header = { alg: "HS256", typ: "JWT" };
  const completePayload: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSec,
  };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(completePayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyToken = (token: string): AuthTokenPayload | null => {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = sign(`${header}.${payload}`);
  if (signature !== expected) return null;

  try {
    const data = JSON.parse(fromBase64Url(payload)) as AuthTokenPayload;
    if (!data.exp || Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
};

export const getAuthFromRequest = (request: NextRequest) => {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
};

export const isRoleAllowed = (role: Role, allowed: Role[]) => allowed.includes(role);
