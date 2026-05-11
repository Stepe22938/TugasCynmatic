/**
 * HomePage.tsx
 * Main product listing page.
 */
import React from "react";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Koleksi Terbaru</h1>
        <p className="text-muted-foreground">Temukan produk pilihan terbaik untuk Anda hari ini.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
