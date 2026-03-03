'use client';

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

type ProductListResponse = {
  data?: {
    items?: Product[];
  };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?limit=200")
      .then((response) => response.json())
      .then((json: ProductListResponse) => setProducts(json.data?.items ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((item) => item.category))],
    [products]
  );

  const brands = useMemo(
    () => [...new Set(products.map((item) => item.brand))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(item.brand);

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, search, selectedCategories, selectedBrands]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-b from-white to-emerald-50 min-h-screen">
      <section className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Explore our full catalog with quick search and filters.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-3 lg:sticky lg:top-20">
              <h2 className="text-base font-semibold text-gray-900">Search & Filters</h2>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="input"
              />

              <div className="border border-emerald-100 rounded-lg p-3 bg-emerald-50/40 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">Categories</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setSelectedCategories(categories)}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="text-xs text-gray-600 hover:underline"
                        onClick={() => setSelectedCategories([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-36 overflow-y-auto pr-1 space-y-2">
                    {categories.map((item) => (
                      <label key={item} className="text-sm flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(item)}
                          onChange={(event) =>
                            setSelectedCategories((prev) =>
                              event.target.checked
                                ? [...prev, item]
                                : prev.filter((name) => name !== item)
                            )
                          }
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">Brands</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setSelectedBrands(brands)}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="text-xs text-gray-600 hover:underline"
                        onClick={() => setSelectedBrands([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-36 overflow-y-auto pr-1 space-y-2">
                    {brands.map((item) => (
                      <label key={item} className="text-sm flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(item)}
                          onChange={(event) =>
                            setSelectedBrands((prev) =>
                              event.target.checked
                                ? [...prev, item]
                                : prev.filter((name) => name !== item)
                            )
                          }
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <p className="text-sm text-gray-600 mb-4">Showing {filteredProducts.length} products</p>

            {loading ? (
              <div className="py-16 text-center text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No products found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
