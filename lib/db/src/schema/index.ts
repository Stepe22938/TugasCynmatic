import { mysqlTable, varchar, decimal, int, timestamp, boolean, mysqlEnum, text, json, bigint } from "drizzle-orm/mysql-core";

// ============================================================
// USERS TABLE — Full schema matching AuthContext User interface
// ============================================================
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  systemId: int("systemId").autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  role: mysqlEnum("role", ["user", "seller", "admin", "kurir"]).default("user"),
  isVerifiedSeller: boolean("isVerifiedSeller").default(false),
  isVerifiedReseller: boolean("isVerifiedReseller").default(false),
  coins: bigint("coins", { mode: "number" }).default(0),
  balance: text("balance").default("0"),
  points: int("points").default(0),
  // Social
  friends: json("friends"),
  friendRequests: json("friendRequests"),
  sentRequests: json("sentRequests"),
  // Referral
  referralCode: varchar("referralCode", { length: 50 }),
  referredBy: varchar("referredBy", { length: 255 }),
  // Ban management
  isBanned: boolean("isBanned").default(false),
  banReason: text("banReason"),
  banType: varchar("banType", { length: 20 }),
  banExpiry: timestamp("banExpiry"),
  // Activity
  activityLog: json("activityLog"),
  purchaseHistory: json("purchaseHistory"),
  ownedCosmetics: json("ownedCosmetics"),
  equippedCosmetics: json("equippedCosmetics"),
  walletTransactions: json("walletTransactions"),
  wishlist: json("wishlist"),
  // Sultan customization
  sultanBadgeColor: varchar("sultanBadgeColor", { length: 50 }),
  sultanGlowEffect: boolean("sultanGlowEffect").default(false),
  sultanCustomTag: varchar("sultanCustomTag", { length: 100 }),
  isSultan: boolean("isSultan").default(false),
  sultanExpiry: timestamp("sultanExpiry"),
  // MyCrypto membership
  isMyCryptoMember: boolean("isMyCryptoMember").default(false),
  myCryptoExpiry: timestamp("myCryptoExpiry"),
  // Profile
  bio: text("bio"),
  theme: varchar("theme", { length: 255 }).default("from-primary to-orange-600"),
  youtubeId: varchar("youtubeId", { length: 50 }),
  useAnimation: boolean("useAnimation").default(false),
  profileLayout: varchar("profileLayout", { length: 20 }).default("premium"),
  avatar: varchar("avatar", { length: 500 }),
  myCoinNft: varchar("myCoinNft", { length: 255 }).default("0"),
  balanceBtc: varchar("balanceBtc", { length: 255 }).default("1.42"),
  balanceEth: varchar("balanceEth", { length: 255 }).default("8.50"),
  balanceUsdt: varchar("balanceUsdt", { length: 255 }).default("500.00"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// PRODUCTS TABLE
// ============================================================
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
  isPreOrder: boolean("isPreOrder").default(false),
  releaseDate: varchar("releaseDate", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// ORDERS TABLE
// ============================================================
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
  sellerVoucherCode: varchar("sellerVoucherCode", { length: 100 }),
  sellerVoucherDiscount: int("sellerVoucherDiscount"),
  coinDiscount: int("coinDiscount"),
  messages: json("messages"),
  problemReport: text("problemReport"),
  courierNote: text("courierNote"),
  reviews: json("reviews"),
});

// ============================================================
// REVIEWS TABLE
// ============================================================
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

// ============================================================
// AUCTIONS TABLE
// ============================================================
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

// ============================================================
// POLLS TABLE
// ============================================================
export const polls = mysqlTable("polls", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  options: json("options").notNull(),
  isActive: boolean("isActive").default(true),
  votedUserIds: json("votedUserIds"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// TICKETS TABLE
// ============================================================
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

// ============================================================
// VOUCHERS TABLE
// ============================================================
export const vouchers = mysqlTable("vouchers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  minPurchase: decimal("minPurchase", { precision: 15, scale: 2 }).default("0"),
  maxDiscount: decimal("maxDiscount", { precision: 15, scale: 2 }),
  expiresAt: timestamp("expiresAt"),
  maxUses: int("maxUses").default(0),
  usedCount: int("usedCount").default(0),
  isActive: boolean("isActive").default(true),
  description: text("description"),
  sellerId: varchar("sellerId", { length: 255 }),
  sellerName: varchar("sellerName", { length: 255 }),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// REDEEM CODES TABLE
// ============================================================
export const redeemCodes = mysqlTable("redeem_codes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  maxUses: int("maxUses").default(0),
  usedBy: json("usedBy"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// ANDROID PACKAGES TABLE
// ============================================================
export const androidPackages = mysqlTable("android_packages", {
  id: int("id").primaryKey().autoincrement(),
  versionName: varchar("version_name", { length: 255 }).notNull(),
  versionCode: int("version_code").notNull(),
  changelog: text("changelog").notNull(),
  fileUrl: varchar("file_url", { length: 500 }),
  fileHash: varchar("file_hash", { length: 255 }),
  buildStatus: mysqlEnum("build_status", ["queued", "building", "success", "failed"]).default("queued").notNull(),
  releaseStatus: mysqlEnum("release_status", ["draft", "latest"]).default("draft").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// NFTS TABLE
// ============================================================
export const nfts = mysqlTable("nfts", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  image: varchar("image", { length: 500 }).notNull(),
  priceCrypto: varchar("price_crypto", { length: 50 }).notNull(),
  cryptoType: varchar("crypto_type", { length: 20 }).notNull(),
  priceMcnft: varchar("price_mcnft", { length: 50 }).notNull(),
  ownerId: varchar("owner_id", { length: 255 }),
  isForSale: boolean("is_for_sale").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// MESSAGES TABLE — Direct Chat between users (with media)
// ============================================================
export const messages = mysqlTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  senderId: varchar("senderId", { length: 255 }).notNull(),
  receiverId: varchar("receiverId", { length: 255 }).notNull(),
  text: text("text"),
  mediaUrl: varchar("mediaUrl", { length: 500 }),
  mediaType: varchar("mediaType", { length: 20 }), // "image" | "video" | null
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// COLLABORATION REQUESTS TABLE
// ============================================================
export const collabRequests = mysqlTable("collab_requests", {
  id: varchar("id", { length: 255 }).primaryKey(),
  fromSellerId: varchar("fromSellerId", { length: 255 }).notNull(),
  fromSellerName: varchar("fromSellerName", { length: 255 }).notNull(),
  toSellerId: varchar("toSellerId", { length: 255 }).notNull(),
  toSellerName: varchar("toSellerName", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "reseller" | "dropship"
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // "pending" | "accepted" | "rejected"
  createdAt: varchar("createdAt", { length: 255 }).notNull(),
  responseAt: varchar("responseAt", { length: 255 }),
  productId: int("productId"),
  productName: varchar("productName", { length: 255 }),
  productPrice: decimal("productPrice", { precision: 15, scale: 2 }),
  productImage: varchar("productImage", { length: 500 }),
  proposedPrice: decimal("proposedPrice", { precision: 15, scale: 2 }),
  proposedQuantity: int("proposedQuantity"),
  commissionPercent: int("commissionPercent"),
  feedbackMessage: text("feedbackMessage"),
});

// ============================================================
// AI SETTINGS TABLE — Global configuration of OpenRouter
// ============================================================
export const aiSettings = mysqlTable("ai_settings", {
  id: varchar("id", { length: 255 }).primaryKey(), // "global"
  aiProvider: varchar("aiProvider", { length: 50 }).default("openrouter"),
  openrouterKey: text("openrouterKey"),
  openrouterModel: varchar("openrouterModel", { length: 255 }),
  obscuraKey: text("obscuraKey"),
  obscuraModel: varchar("obscuraModel", { length: 255 }),
});

// ============================================================
// GACHA REWARDS TABLE — Luck Royale / Mystery Draw prizes
// ============================================================
export const gachaRewards = mysqlTable("gacha_rewards", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "coins" | "points" | "item" | "custom_badge"
  value: varchar("value", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 50 }).notNull(), // "mythic" | "legendary" | "epic" | "rare" | "common"
  chance: decimal("chance", { precision: 5, scale: 2 }).notNull(),
  image: varchar("image", { length: 500 }),
  isActive: boolean("isActive").default(true),
  eventType: varchar("eventType", { length: 50 }).default("royale"), // "mystery" | "royale" | "faded"
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// AI ANALYSIS HISTORY TABLE — Sentiment, tags & summaries logs
// ============================================================
export const aiAnalysisHistory = mysqlTable("ai_analysis_history", {
  id: varchar("id", { length: 255 }).primaryKey(),
  ticketId: varchar("ticketId", { length: 255 }).notNull(),
  userId: varchar("userId", { length: 255 }).notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  sentiment: varchar("sentiment", { length: 50 }).notNull(),
  tags: json("tags").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  aiResponse: text("aiResponse"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// ============================================================
// AI COMPANION MODELS TABLE — Admin-managed list of AI models
// available for side-by-side comparison in the AI Companion page
// ============================================================
export const aiCompanionModels = mysqlTable("ai_companion_models", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),       // Display name e.g. "GPT-4o Mini"
  modelId: varchar("modelId", { length: 255 }).notNull(), // OpenRouter model ID e.g. "openai/gpt-4o-mini"
  description: text("description"),                        // Short description shown in UI
  color: varchar("color", { length: 30 }).default("#6366f1"), // Accent hex color for the card
  isEnabled: boolean("isEnabled").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});
