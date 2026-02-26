import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/guards";
import { fail, ok } from "@/lib/http";
import { nowIso } from "@/lib/utils";

const normalize = (value: string) => value.trim();

export async function GET() {
  const taxonomies = await db.readTaxonomies();
  return ok(taxonomies);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as {
    type?: "category" | "subcategory" | "brand";
    name?: string;
    category?: string;
  };

  const type = body.type;
  const name = normalize(String(body.name ?? ""));
  const category = normalize(String(body.category ?? ""));

  if (!type || !name) return fail("type and name are required.", 400);

  const taxonomies = await db.readTaxonomies();

  if (type === "category") {
    if (taxonomies.categories.some((item) => item.toLowerCase() === name.toLowerCase())) {
      return fail("Category already exists.", 409);
    }
    taxonomies.categories.push(name);
  }

  if (type === "brand") {
    if (taxonomies.brands.some((item) => item.toLowerCase() === name.toLowerCase())) {
      return fail("Brand already exists.", 409);
    }
    taxonomies.brands.push(name);
  }

  if (type === "subcategory") {
    if (!category) return fail("category is required for subcategory.", 400);
    if (!taxonomies.categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
      return fail("Selected category does not exist.", 400);
    }
    const exists = taxonomies.subcategories.some(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.category.toLowerCase() === category.toLowerCase()
    );
    if (exists) return fail("Subcategory already exists for this category.", 409);
    taxonomies.subcategories.push({ name, category });
  }

  await db.writeTaxonomies(taxonomies);
  return ok(taxonomies, 201);
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as {
    type?: "category" | "subcategory" | "brand";
    name?: string;
    newName?: string;
    category?: string;
    newCategory?: string;
  };

  const type = body.type;
  const name = normalize(String(body.name ?? ""));
  const newName = normalize(String(body.newName ?? ""));
  const category = normalize(String(body.category ?? ""));
  const newCategory = normalize(String(body.newCategory ?? ""));

  if (!type || !name || !newName) return fail("type, name and newName are required.", 400);

  const taxonomies = await db.readTaxonomies();
  const products = await db.readProducts();

  if (type === "category") {
    const exists = taxonomies.categories.some((item) => item === name);
    if (!exists) return fail("Category not found.", 404);
    if (taxonomies.categories.some((item) => item === newName)) {
      return fail("Category with newName already exists.", 409);
    }

    taxonomies.categories = taxonomies.categories.map((item) => (item === name ? newName : item));
    taxonomies.subcategories = taxonomies.subcategories.map((item) =>
      item.category === name ? { ...item, category: newName } : item
    );

    for (const product of products) {
      if (product.category === name) {
        product.category = newName;
        product.updatedAt = nowIso();
      }
    }
  }

  if (type === "brand") {
    const exists = taxonomies.brands.some((item) => item === name);
    if (!exists) return fail("Brand not found.", 404);
    if (taxonomies.brands.some((item) => item === newName)) {
      return fail("Brand with newName already exists.", 409);
    }

    taxonomies.brands = taxonomies.brands.map((item) => (item === name ? newName : item));
    for (const product of products) {
      if (product.brand === name) {
        product.brand = newName;
        product.updatedAt = nowIso();
      }
    }
  }

  if (type === "subcategory") {
    if (!category) return fail("category is required for subcategory update.", 400);
    const targetCategory = newCategory || category;
    const index = taxonomies.subcategories.findIndex((item) => item.name === name && item.category === category);
    if (index < 0) return fail("Subcategory not found.", 404);
    if (!taxonomies.categories.includes(targetCategory)) {
      return fail("Target category does not exist.", 400);
    }
    const duplicate = taxonomies.subcategories.some(
      (item, idx) => idx !== index && item.name === newName && item.category === targetCategory
    );
    if (duplicate) return fail("Subcategory with newName already exists in target category.", 409);

    taxonomies.subcategories[index] = { name: newName, category: targetCategory };
    for (const product of products) {
      if (product.subcategory === name && product.category === category) {
        product.subcategory = newName;
        product.category = targetCategory;
        product.updatedAt = nowIso();
      }
    }
  }

  await db.writeTaxonomies(taxonomies);
  await db.writeProducts(products);
  return ok(taxonomies);
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  const roleCheck = requireRole(user, "admin");
  if (!roleCheck.ok) return fail(roleCheck.message, roleCheck.status);

  const body = (await request.json()) as {
    type?: "category" | "subcategory" | "brand";
    name?: string;
    category?: string;
  };

  const type = body.type;
  const name = normalize(String(body.name ?? ""));
  const category = normalize(String(body.category ?? ""));

  if (!type || !name) return fail("type and name are required.", 400);

  const taxonomies = await db.readTaxonomies();
  const products = await db.readProducts();

  if (type === "category") {
    const inUse = products.some((product) => product.category === name);
    if (inUse) return fail("Cannot delete category while products are using it.", 409);

    taxonomies.categories = taxonomies.categories.filter((item) => item !== name);
    taxonomies.subcategories = taxonomies.subcategories.filter((item) => item.category !== name);
  }

  if (type === "brand") {
    const inUse = products.some((product) => product.brand === name);
    if (inUse) return fail("Cannot delete brand while products are using it.", 409);

    taxonomies.brands = taxonomies.brands.filter((item) => item !== name);
  }

  if (type === "subcategory") {
    if (!category) return fail("category is required for subcategory delete.", 400);
    const inUse = products.some((product) => product.subcategory === name && product.category === category);
    if (inUse) return fail("Cannot delete subcategory while products are using it.", 409);

    taxonomies.subcategories = taxonomies.subcategories.filter(
      (item) => !(item.name === name && item.category === category)
    );
  }

  await db.writeTaxonomies(taxonomies);
  return ok(taxonomies);
}
