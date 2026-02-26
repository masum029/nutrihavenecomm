'use client';

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Slider from "@/components/Slider";
import type { Product, SectionAd } from "@/types";

type ListResponse = {
  data: {
    items: Product[];
  };
};

type SectionAdsResponse = {
  data?: {
    items?: SectionAd[];
  };
};

const PER_CHUNK = 6;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sectionAds, setSectionAds] = useState<SectionAd[]>([]);
  const [now, setNow] = useState(Date.now());
  const [search, setSearch] = useState("");
  const [visibleByCategory, setVisibleByCategory] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((response) => response.json())
      .then((json: ListResponse) => setProducts(json.data.items ?? []))
      .catch(() => setProducts([]));

    fetch("/api/section-ads")
      .then((response) => response.json())
      .then((json: SectionAdsResponse) => setSectionAds(json.data?.items ?? []))
      .catch(() => setSectionAds([]));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const getCountdownMeta = (endDateIso: string) => {
    const diffMs = Math.max(0, new Date(endDateIso).getTime() - now);
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const pad = (value: number) => String(value).padStart(2, "0");
    const compact = {
      dd: pad(days),
      hh: pad(hours),
      mm: pad(minutes),
    };

    if (diffMs <= 0) {
      return {
        ...compact,
        level: "ended" as const,
      };
    }

    if (diffMs <= 24 * 60 * 60 * 1000) {
      return {
        ...compact,
        level: "critical" as const,
      };
    }

    if (diffMs <= 3 * 24 * 60 * 60 * 1000) {
      return {
        ...compact,
        level: "warning" as const,
      };
    }

    return {
      ...compact,
      level: "normal" as const,
    };
  };

  const countdownBlockClass = (level: "normal" | "warning" | "critical" | "ended") => {
    if (level === "critical") return "bg-red-600 text-white border-red-700 animate-pulse";
    if (level === "warning") return "bg-red-500 text-white border-red-600";
    if (level === "ended") return "bg-gray-300 text-gray-700 border-gray-400";
    return "bg-emerald-600 text-white border-emerald-700";
  };

  const renderCountdownBlocks = (countdown: ReturnType<typeof getCountdownMeta> | null) => {
    if (!countdown) {
      return (
        <div className="flex items-center gap-1">
          <span className="px-2 py-1 rounded-md border text-xs font-semibold bg-gray-300 text-gray-700 border-gray-400">00D</span>
          <span className="px-2 py-1 rounded-md border text-xs font-semibold bg-gray-300 text-gray-700 border-gray-400">00H</span>
          <span className="px-2 py-1 rounded-md border text-xs font-semibold bg-gray-300 text-gray-700 border-gray-400">00M</span>
        </div>
      );
    }

    const blockClass = countdownBlockClass(countdown.level);

    return (
      <div className="flex items-center gap-1">
        <span className={`px-2 py-1 rounded-md border text-xs font-semibold ${blockClass}`}>{countdown.dd}D</span>
        <span className={`px-2 py-1 rounded-md border text-xs font-semibold ${blockClass}`}>{countdown.hh}H</span>
        <span className={`px-2 py-1 rounded-md border text-xs font-semibold ${blockClass}`}>{countdown.mm}M</span>
      </div>
    );
  };

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);
      return matchesSearch;
    });
  }, [products, search]);

  const categories = useMemo(
    () => [...new Set(filteredProducts.map((item) => item.category))],
    [filteredProducts]
  );

  const sectionProducts = useMemo(
    () => ({
      trending: filteredProducts.filter((item) => item.flags.trending).slice(0, 6),
      ramadan: filteredProducts.filter((item) => item.flags.ramadanExclusive).slice(0, 6),
      bestSell: filteredProducts.filter((item) => item.flags.bestSell).slice(0, 6),
    }),
    [filteredProducts]
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-b from-white to-emerald-50">
      <Slider />

      <section className="max-w-7xl mx-auto mt-8 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">🌱</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Organic</h3>
            <p className="text-gray-700">Pure, natural ingredients sourced from trusted farms.</p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">🚚</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-700">Quick dispatch and reliable delivery to your doorstep.</p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">💰</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-700">Great value deals with smart discounts on top products.</p>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">✅</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assured</h3>
            <p className="text-gray-700">Carefully selected products with quality-first standards.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto space-y-12">
        {categories.map((category) => {
          const categoryProducts = filteredProducts.filter((item) => item.category === category);
          const visible = visibleByCategory[category] ?? PER_CHUNK;
          const current = categoryProducts.slice(0, visible);
          const hasMore = current.length < categoryProducts.length;
          const sectionAd = sectionAds.find((item) => item.section.toLowerCase() === category.toLowerCase());
          const countdown = sectionAd ? getCountdownMeta(sectionAd.offerEndsAt) : null;

          return (
            <div key={category}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold">{category}</h2>
                <div className="flex items-center gap-2">
                  {renderCountdownBlocks(countdown)}
                  {hasMore && (
                    <button
                      className="btn-primary"
                      onClick={() =>
                        setVisibleByCategory((prev) => ({
                          ...prev,
                          [category]: (prev[category] ?? PER_CHUNK) + PER_CHUNK,
                        }))
                      }
                    >
                      Show More
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {current.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl overflow-hidden shadow-md">
                {sectionAd ? (
                  <>
                    <img
                      src={sectionAd.image}
                      alt={`${category} offer`}
                      className="w-full h-32 sm:h-40 md:h-48 object-cover"
                    />
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900 tracking-wide">🔥 {category} Special Offer</p>
                      {renderCountdownBlocks(countdown)}
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-5 flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">{category} Special Offer Banner</p>
                    <span className="text-sm text-gray-500">No banner configured yet</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="bg-white border border-emerald-100 rounded-xl p-8 text-center text-gray-600">
            No products found for current search/filter.
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto mt-14 mb-6">
        <h2 className="text-xl font-semibold mb-4">Section Flags</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold mb-3">Trending</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {sectionProducts.trending.map((item) => <p key={item.id}>{item.name}</p>)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold mb-3">Ramadan Exclusive</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {sectionProducts.ramadan.map((item) => <p key={item.id}>{item.name}</p>)}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold mb-3">Best Sell</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {sectionProducts.bestSell.map((item) => <p key={item.id}>{item.name}</p>)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
