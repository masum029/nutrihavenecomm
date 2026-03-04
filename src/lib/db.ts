import fs from "node:fs/promises";
import path from "node:path";
import { kv } from "@vercel/kv";
import type { Cart, Order, Product, SectionAd, SliderImage, TaxonomyStore, User } from "@/types";

const dataPath = (fileName: string) => path.join(process.cwd(), "src", "data", fileName);

async function readJson<T>(fileName: string): Promise<T> {
  const content = await fs.readFile(dataPath(fileName), "utf-8");
  return JSON.parse(content) as T;
}

async function writeJson<T>(fileName: string, data: T): Promise<void> {
  await fs.writeFile(dataPath(fileName), JSON.stringify(data, null, 2), "utf-8");
}

const KV_KEYS = {
  products: "nutriheaven:products",
  users: "nutriheaven:users",
  carts: "nutriheaven:carts",
  orders: "nutriheaven:orders",
  taxonomies: "nutriheaven:taxonomies",
  sliderImages: "nutriheaven:slider-images",
  sectionAds: "nutriheaven:section-ads",
} as const;

const getKvEnv = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const isKvConfigured = () => {
  const { url, token } = getKvEnv();
  return Boolean(url && token);
};

async function readStore<T>(key: string, fileName: string): Promise<T> {
  if (!isKvConfigured()) {
    return readJson<T>(fileName);
  }

  const existing = await kv.get<T>(key);
  if (existing !== null && existing !== undefined) {
    return existing;
  }

  const seed = await readJson<T>(fileName);
  await kv.set(key, seed);
  return seed;
}

async function writeStore<T>(key: string, fileName: string, data: T): Promise<void> {
  if (isKvConfigured()) {
    await kv.set(key, data);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Persistent data store is not configured. Set KV_REST_API_URL + KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  await writeJson(fileName, data);
}

export const db = {
  readProducts: () => readStore<Product[]>(KV_KEYS.products, "products.json"),
  writeProducts: (products: Product[]) => writeStore(KV_KEYS.products, "products.json", products),

  readUsers: () => readStore<User[]>(KV_KEYS.users, "users.json"),
  writeUsers: (users: User[]) => writeStore(KV_KEYS.users, "users.json", users),

  readCarts: () => readStore<Cart[]>(KV_KEYS.carts, "carts.json"),
  writeCarts: (carts: Cart[]) => writeStore(KV_KEYS.carts, "carts.json", carts),

  readOrders: () => readStore<Order[]>(KV_KEYS.orders, "orders.json"),
  writeOrders: (orders: Order[]) => writeStore(KV_KEYS.orders, "orders.json", orders),

  readTaxonomies: () => readStore<TaxonomyStore>(KV_KEYS.taxonomies, "taxonomies.json"),
  writeTaxonomies: (taxonomies: TaxonomyStore) => writeStore(KV_KEYS.taxonomies, "taxonomies.json", taxonomies),

  readSliderImages: () => readStore<SliderImage[]>(KV_KEYS.sliderImages, "slider-images.json"),
  writeSliderImages: (items: SliderImage[]) => writeStore(KV_KEYS.sliderImages, "slider-images.json", items),

  readSectionAds: () => readStore<SectionAd[]>(KV_KEYS.sectionAds, "section-ads.json"),
  writeSectionAds: (items: SectionAd[]) => writeStore(KV_KEYS.sectionAds, "section-ads.json", items),
};
