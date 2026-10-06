import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "owner_session";

function secret() {
  return process.env.OWNER_SESSION_SECRET || process.env.OWNER_PASSWORD || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createOwnerCookie() {
  const value = `${Date.now()}`;
  return `${COOKIE}=${value}.${sign(value)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`;
}

export function clearOwnerCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export function isOwnerRequest(request: Request) {
  const s = secret();
  if (!s) return false;
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [value, signature] = match[1].split(".");
  if (!value || !signature) return false;
  const expected = sign(value);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: "Acesso restrito ao proprietário." }, { status: 401 });
}
