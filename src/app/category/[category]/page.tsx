'use client';

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

type Props = {
  params: Promise<{ category: string }>;
};

export default function CategoryPage({ params }: Props) {
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [visible, setVisible] = useState(6);

  useEffect(() => {
    params.then(({ category }) => {
      const decoded = decodeURIComponent(category);
      setCategory(decoded);
      fetch(`/api/products?category=${encodeURIComponent(decoded)}&limit=100`)
        .then((response) => response.json())
        .then((data) => setProducts(data.data.items ?? []))
        .catch(() => setProducts([]));
    });
  }, [params]);

  const current = products.slice(0, visible);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-6">Category: {category}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {current.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
      {visible < products.length && (
        <div className="text-center mt-6">
          <button className="btn-primary" onClick={() => setVisible((value) => value + 6)}>
            Show More
          </button>
        </div>
      )}
    </div>
  );
}
