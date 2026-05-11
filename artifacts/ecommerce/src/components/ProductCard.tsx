/**
 * ProductCard.tsx
 * Component to display a single product in the listing.
 */
import React from "react";
import { formatPrice } from "../utils/formatPrice";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductProps {
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
  };
}

export function ProductCard({ product }: ProductProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      }
    });

    toast({
      title: "Berhasil",
      description: "Produk berhasil ditambahkan ke keranjang!",
    });
  };

  return (
    <div className="group flex flex-col bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-semibold bg-white/90 text-foreground backdrop-blur-sm rounded-md shadow-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-4">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t">
          <span className="font-bold text-lg text-primary">{formatPrice(product.price)}</span>
          <Button
            onClick={handleAddToCart}
            data-testid={`button-add-to-cart-${product.id}`}
            size="sm"
            className="rounded-full shadow-sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
