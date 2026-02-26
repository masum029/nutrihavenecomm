import fs from "node:fs/promises";
import path from "node:path";
import type { Cart, Order, Product, SectionAd, SliderImage, TaxonomyStore, User } from "@/types";

const dataPath = (fileName: string) => path.join(process.cwd(), "src", "data", fileName);

async function readJson<T>(fileName: string): Promise<T> {
  const content = await fs.readFile(dataPath(fileName), "utf-8");
  return JSON.parse(content) as T;
}

async function writeJson<T>(fileName: string, data: T): Promise<void> {
  await fs.writeFile(dataPath(fileName), JSON.stringify(data, null, 2), "utf-8");
}

export const db = {
  readProducts: () => readJson<Product[]>("products.json"),
  writeProducts: (products: Product[]) => writeJson("products.json", products),

  readUsers: () => readJson<User[]>("users.json"),
  writeUsers: (users: User[]) => writeJson("users.json", users),

  readCarts: () => readJson<Cart[]>("carts.json"),
  writeCarts: (carts: Cart[]) => writeJson("carts.json", carts),

  readOrders: () => readJson<Order[]>("orders.json"),
  writeOrders: (orders: Order[]) => writeJson("orders.json", orders),

  readTaxonomies: () => readJson<TaxonomyStore>("taxonomies.json"),
  writeTaxonomies: (taxonomies: TaxonomyStore) => writeJson("taxonomies.json", taxonomies),

  readSliderImages: () => readJson<SliderImage[]>("slider-images.json"),
  writeSliderImages: (items: SliderImage[]) => writeJson("slider-images.json", items),

  readSectionAds: () => readJson<SectionAd[]>("section-ads.json"),
  writeSectionAds: (items: SectionAd[]) => writeJson("section-ads.json", items),
};
