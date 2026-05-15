import { mysqlTable, varchar, decimal, int, timestamp, boolean, mysqlEnum, text, json, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  role: mysqlEnum("role", ["user", "seller", "admin", "kurir"]).default("user"),
  isVerifiedSeller: boolean("isVerifiedSeller").default(false),
  isVerifiedReseller: boolean("isVerifiedReseller").default(false),
  coins: bigint("coins", { mode: "number" }).default(0),
  balance: text("balance").default("0"),
  points: int("points").default(0),
  activityLog: json("activityLog"),
  purchaseHistory: json("purchaseHistory"),
  ownedCosmetics: json("ownedCosmetics"),
  equippedCosmetics: json("equippedCosmetics"),
  walletTransactions: json("walletTransactions"), 
  sultanBadgeColor: varchar("sultanBadgeColor", { length: 50 }),
  sultanGlowEffect: boolean("sultanGlowEffect").default(false),
  sultanCustomTag: varchar("sultanCustomTag", { length: 100 }),
  isMyCryptoMember: boolean("isMyCryptoMember").default(false),
  myCryptoExpiry: timestamp("myCryptoExpiry"),
  bio: text("bio"),
  theme: varchar("theme", { length: 255 }).default("from-primary to-orange-600"),
  youtubeId: varchar("youtubeId", { length: 50 }),
  useAnimation: boolean("useAnimation").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  longDescription: text("longDescription"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  image: varchar("image", { length: 500 }),
  images: json("images"), 
  category: varchar("category", { length: 100 }),
  specs: json("specs"), 
  stock: int("stock").default(0),
  sellerId: varchar("sellerId", { length: 255 }),
  sellerName: varchar("sellerName", { length: 255 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  isFlashSale: boolean("isFlashSale").default(false),
  discountPercent: int("discountPercent").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull(),
  date: timestamp("date").defaultNow(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }),
  shippingFee: decimal("shippingFee", { precision: 15, scale: 2 }),
  grandTotal: decimal("grandTotal", { precision: 15, scale: 2 }),
  status: varchar("status", { length: 50 }).default("placed"),
  shippingInfo: json("shippingInfo"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  voucherCode: varchar("voucherCode", { length: 100 }),
  voucherDiscount: int("voucherDiscount"),
  coinDiscount: int("coinDiscount"),
  messages: json("messages"),
  problemReport: text("problemReport"),
  courierNote: text("courierNote"),
  reviews: json("reviews"), 
});

export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("productId").notNull(),
  orderId: varchar("orderId", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }),
  rating: int("rating").notNull(),
  status: varchar("status", { length: 50 }),
  comment: text("comment"),
  mediaFiles: json("mediaFiles"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const auctions = mysqlTable("auctions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sellerId: varchar("sellerId", { length: 255 }).notNull(),
  sellerName: varchar("sellerName", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  startPrice: decimal("startPrice", { precision: 15, scale: 2 }),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }),
  minStep: decimal("minStep", { precision: 15, scale: 2 }),
  endTime: timestamp("endTime"),
  status: varchar("status", { length: 20 }).default("active"),
  bids: json("bids"), 
  winnerId: varchar("winnerId", { length: 255 }),
  winnerName: varchar("winnerName", { length: 255 }),
  isPaid: boolean("isPaid").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const polls = mysqlTable("polls", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  options: json("options").notNull(), 
  isActive: boolean("isActive").default(true),
  votedUserIds: json("votedUserIds"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const tickets = mysqlTable("tickets", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("open"),
  messages: json("messages"), 
  createdAt: timestamp("createdAt").defaultNow(),
});

// NEW TABLE: Vouchers
export const vouchers = mysqlTable("vouchers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  minPurchase: decimal("minPurchase", { precision: 15, scale: 2 }).default("0"),
  maxDiscount: decimal("maxDiscount", { precision: 15, scale: 2 }),
  expiresAt: timestamp("expiresAt"),
  maxUses: int("maxUses").default(0),
  usedCount: int("usedCount").default(0),
  isActive: boolean("isActive").default(true),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// NEW TABLE: Redeem Codes
export const redeemCodes = mysqlTable("redeem_codes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // 'coin' | 'balance'
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  maxUses: int("maxUses").default(0),
  usedBy: json("usedBy"), // Array of user IDs
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
});