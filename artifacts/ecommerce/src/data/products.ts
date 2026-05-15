/**
 * products.ts
 * Produk statis bawaan — dimiliki oleh Admin Toko (sellerId: "admin-001").
 * Setiap produk memiliki sellerId & sellerName sehingga konsisten
 * dengan produk yang disubmit oleh seller.
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  specs: { label: string; value: string }[];
  sellerId: string;
  sellerName: string;
  isFlashSale?: boolean;
  discountPercent?: number;
  stock: number;
  isPreOrder?: boolean;
  releaseDate?: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Sepatu Sneakers Premium",
    description: "Sneakers modern dengan sol yang nyaman untuk aktivitas sehari-hari",
    longDescription:
      "Sepatu sneakers premium yang dirancang untuk kenyamanan maksimal sepanjang hari. " +
      "Menggunakan bahan mesh breathable yang membuat kaki tetap sejuk, " +
      "sol berbasis EVA yang ringan namun tahan lama, serta desain modern yang cocok " +
      "untuk segala kesempatan — dari aktivitas santai hingga olahraga ringan.",
    price: 299000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=500&fit=crop",
    ],
    category: "Sepatu",
    specs: [
      { label: "Bahan Upper", value: "Mesh Breathable + Kulit Sintetis" },
      { label: "Sol", value: "EVA Foam — Ringan & Tahan Lama" },
      { label: "Ukuran", value: "38 – 44" },
      { label: "Warna", value: "Merah, Putih, Hitam" },
      { label: "Berat", value: "±280 gram / pasang" },
    ],
    sellerId: "admin-001",
    sellerName: "Admin Toko",
    stock: 50,
  },
  {
    id: 2,
    name: "Tas Ransel Canvas",
    description: "Ransel kasual berbahan canvas berkualitas tinggi, cocok untuk kampus dan kerja",
    longDescription:
      "Tas ransel canvas premium dengan kapasitas besar yang ideal untuk mahasiswa dan pekerja kantoran. " +
      "Dilengkapi kantong laptop berlapisan busa hingga 15 inci, " +
      "beberapa kompartemen terorganisir, serta bahan canvas tebal yang tahan air dan goresan.",
    price: 189000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=500&fit=crop",
    ],
    category: "Tas",
    specs: [
      { label: "Bahan", value: "Canvas 900D — Tahan Air" },
      { label: "Kapasitas", value: "30 Liter" },
      { label: "Kompartemen Laptop", value: "Hingga 15 inci" },
      { label: "Dimensi", value: "45 × 30 × 15 cm" },
      { label: "Warna", value: "Abu-abu, Navy, Hitam" },
    ],
    sellerId: "admin-001",
    sellerName: "Admin Toko",
    stock: 50,
  },
  {
    id: 3,
    name: "Kemeja Flanel Kotak-kotak",
    description: "Kemeja flanel premium dengan motif kotak klasik, hangat dan stylish",
    longDescription:
      "Kemeja flanel dengan motif kotak klasik yang tak lekang oleh waktu. " +
      "Dibuat dari bahan flanel 100% cotton brushed yang terasa lembut di kulit " +
      "dan memberikan kehangatan ekstra di cuaca dingin. Cocok dipakai sebagai outer maupun kemeja.",
    price: 159000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=600&h=500&fit=crop",
    ],
    category: "Pakaian",
    specs: [
      { label: "Bahan", value: "100% Cotton Brushed Flannel" },
      { label: "Fit", value: "Regular Fit" },
      { label: "Ukuran", value: "S, M, L, XL, XXL" },
      { label: "Motif", value: "Kotak Klasik (Plaid)" },
      { label: "Warna", value: "Merah-Hitam, Biru-Putih, Hijau-Hitam" },
    ],
    sellerId: "admin-001",
    sellerName: "Admin Toko",
    stock: 50,
  },
  {
    id: 4,
    name: "Jam Tangan Minimalis",
    description: "Jam tangan dengan desain minimalis elegan, cocok untuk segala kesempatan",
    longDescription:
      "Jam tangan bergaya minimalis dengan dial bersih tanpa angka yang memberikan kesan elegan modern. " +
      "Menggunakan mesin Quartz Jepang yang akurat dan tahan lama, " +
      "tali berbahan kulit sintetis premium yang nyaman di pergelangan tangan, " +
      "serta kaca mineral anti-goresan. Tahan percikan air hingga 3 ATM.",
    price: 459000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=500&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=600&h=500&fit=crop",
      "https://images.unsplash.com/photo-1548171916-c8fd8b54b473?w=600&h=500&fit=crop",
    ],
    category: "Aksesori",
    specs: [
      { label: "Mesin", value: "Quartz Jepang" },
      { label: "Kaca", value: "Mineral Anti-Goresan" },
      { label: "Tali", value: "Kulit Sintetis Premium" },
      { label: "Ketahanan Air", value: "3 ATM" },
      { label: "Diameter Case", value: "40mm" },
    ],
    sellerId: "admin-001",
    sellerName: "Admin Toko",
    stock: 50,
  },
];

export function getProductById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}
