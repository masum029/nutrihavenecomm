import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { nowIso, toPositiveInt, toSlug } from "@/lib/utils";
import { validateProductInput } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const products = await db.readProducts();
  const params = request.nextUrl.searchParams;

  const category = params.get("category")?.trim().toLowerCase();
  const subcategory = params.get("subcategory")?.trim().toLowerCase();
  const brand = params.get("brand")?.trim().toLowerCase();
  const section = params.get("section")?.trim().toLowerCase();
  const search = params.get("search")?.trim().toLowerCase();
  const limit = toPositiveInt(params.get("limit") ?? "6", 6);
  const offset = toPositiveInt(params.get("offset") ?? "0", 0);

  let filtered = [...products];
  if (category) filtered = filtered.filter((item) => item.category.toLowerCase() === category);
  if (subcategory) filtered = filtered.filter((item) => item.subcategory.toLowerCase() === subcategory);
  if (brand) filtered = filtered.filter((item) => item.brand.toLowerCase() === brand);
  if (search) {
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    );
  }

  if (section === "trending") filtered = filtered.filter((item) => item.flags.trending);
  if (section === "ramadan-exclusive") filtered = filtered.filter((item) => item.flags.ramadanExclusive);
  if (section === "best-sell") filtered = filtered.filter((item) => item.flags.bestSell);

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  return ok({
    items,
    total,
    hasMore: offset + limit < total,
    category,
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const roleCheck = requireRole(user, "admin");
    if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = validateProductInput(body);
    if (!parsed.ok) return fail(parsed.message, 400);

    const products = await db.readProducts();
    const taxonomies = await db.readTaxonomies();

    if (!taxonomies.categories.includes(parsed.data.category)) {
      return fail("Invalid category. Please create/select from taxonomy.", 400);
    }
    if (!taxonomies.brands.includes(parsed.data.brand)) {
      return fail("Invalid brand. Please create/select from taxonomy.", 400);
    }
    const subcategoryMatch = taxonomies.subcategories.some(
      (item) => item.name === parsed.data.subcategory && item.category === parsed.data.category
    );
    if (!subcategoryMatch) {
      return fail("Invalid subcategory for selected category.", 400);
    }

    const timestamp = nowIso();

    const newProduct = {
      id: `prd_${Date.now()}`,
      slug: toSlug(parsed.data.name),
      ...parsed.data,
      rating: 0,
      reviews: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.writeProducts([newProduct, ...products]);
    return ok(newProduct, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return fail(`Unable to create product right now: ${message}`, 500);
  }
}
