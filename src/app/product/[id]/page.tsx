import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getFinalPrice } from "@/lib/pricing";
import AddToCartButton from "@/components/AddToCartButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const products = await db.readProducts();
  const product = products.find((item) => item.id === id || item.slug === id);

  if (!product) {
    return { title: "Product not found | NutriHeaven" };
  }

  return {
    title: `${product.name} | NutriHeaven`,
    description: product.description,
    keywords: [product.category, product.subcategory, product.brand, "organic", "nutriheaven"],
  };
}

export default async function ProductDetail({ params }: Params) {
  const { id } = await params;
  const products = await db.readProducts();
  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    notFound();
  }

  const finalPrice = getFinalPrice(product);
  const discount = Number((product.price - finalPrice).toFixed(2));
  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div className="w-full">
      <div className="bg-gray-100 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-gray-600">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <span>/</span>
          <Link href="/" className="hover:text-primary transition">Products</Link>
          <span>/</span>
          <span className="text-primary font-semibold">{product.name}</span>
        </div>
      </div>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="flex items-center justify-center">
              <div className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
                {discount > 0 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    Save ${discount.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="inline-block w-fit px-3 py-1 bg-accent bg-opacity-20 text-accent font-semibold text-sm rounded-full mb-4">
                {product.category} • {product.subcategory} • {product.brand}
              </span>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{product.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-2xl ${i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                  ))}
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{product.rating}</span>
                  <span className="text-gray-600 ml-2">({product.reviews} customer reviews)</span>
                </div>
              </div>

              <p className="text-lg text-gray-700 mb-8">{product.description}</p>

              <div className="mb-8 pb-8 border-b-2 border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl font-black text-primary">${finalPrice.toFixed(2)}</span>
                  {discount > 0 && <span className="text-3xl text-gray-500 line-through">${product.price.toFixed(2)}</span>}
                </div>
                <p className="text-sm text-gray-600">Stock available: {product.stock}</p>
              </div>

              <div className="mb-8">
                <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Why Choose This Product?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> 100% Organic & Natural</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Role-based secure checkout</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Real-time stock tracking</li>
                  <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Category and brand organized catalog</li>
                </ul>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t-2 border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProducts.map((related) => (
                  <Link key={related.id} href={`/product/${related.id}`} className="card bg-white overflow-hidden group cursor-pointer hover:shadow-2xl">
                    <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                      <Image src={related.image} alt={related.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition">{related.name}</h3>
                      <span className="text-xl font-bold text-primary">${getFinalPrice(related).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
