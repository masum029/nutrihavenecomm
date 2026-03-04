# Vercel Production Setup (Free-friendly)

Use this checklist to make product upload + product creation work in production.

## 1) Configure Blob for product images

1. In Vercel, open **Storage → Blob**.
2. Create/select a Blob store.
3. If this store is for storefront product images, use **public** access.
4. Copy the **Read/Write Token**.
5. In your Vercel project: **Settings → Environment Variables** add:
   - `BLOB_READ_WRITE_TOKEN`
   - `BLOB_STORE_ACCESS` = `public` (or `private` if intentionally private)

## 2) Configure Redis/KV for app data writes

This app writes products/orders/users/taxonomies at runtime. On Vercel, filesystem writes are not allowed.

1. Add a Redis integration from Vercel Marketplace (Upstash Redis).
2. Copy REST credentials.
3. In your Vercel project: **Settings → Environment Variables** add:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

## 3) Redeploy

1. Go to **Deployments**.
2. Redeploy latest commit (or push a new commit).

## 4) Verify

- Upload health endpoint (admin session): `/api/health/upload-storage`
  - Expected: success true, mode `blob`
- Admin product create should save without read-only filesystem errors.

## Notes

- Local development can still fallback to local JSON/filesystem if KV vars are not set.
- Production should always use Blob + KV/Redis.
