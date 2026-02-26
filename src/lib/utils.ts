export const nowIso = () => new Date().toISOString();

export const makeId = (prefix: string) => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
};

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toPositiveInt = (value: unknown, fallback = 1) => {
  const parsed = Math.floor(toNumber(value, fallback));
  return parsed > 0 ? parsed : fallback;
};

export const normalize = (value: string) => value.trim().toLowerCase();

export const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
