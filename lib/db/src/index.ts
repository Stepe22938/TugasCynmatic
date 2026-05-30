import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL tidak ditemukan di .env! Pastikan DATABASE_URL sudah diset.\n" +
    "Contoh: DATABASE_URL=mysql://user:password@host:3306/cynmatic_db"
  );
}

// Support for mysql:// and mysql2:// URL schemes
const connectionString = process.env.DATABASE_URL.replace(/^mysql:\/\//, "mysql2://");

// Create connection pool for better performance & stability
export const pool = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 4,
  maxIdle: 4,
  idleTimeout: 30000,
  queueLimit: 0,
  connectTimeout: 10000,      // 10s connection timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const isTransientDbError = (error: any) =>
  ["ECONNRESET", "PROTOCOL_CONNECTION_LOST", "ETIMEDOUT", "EPIPE"].includes(String(error?.code || ""));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runDbOperationWithRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === 4) throw error;
      console.warn(`⚠️  MariaDB transient error (${error.code}) on ${label}, retry ${attempt}/3...`);
      await wait(120 * attempt);
    }
  }
  throw lastError;
}

const rawExecute = pool.execute.bind(pool);
(pool as any).execute = async (...args: any[]) => {
  return runDbOperationWithRetry(() => rawExecute(...args as [any, any]), "execute");
};

const rawQuery = pool.query.bind(pool);
(pool as any).query = async (...args: any[]) => {
  return runDbOperationWithRetry(() => rawQuery(...args as [any, any]), "query");
};

(pool as any).on?.("error", (error: any) => {
  console.warn(`⚠️  MariaDB pool emitted error: ${error?.code || error?.message || error}`);
});

// Test connection on startup and log result & run self-healing schema checks
pool.getConnection()
  .then(async (conn) => {
    console.log("✅ MariaDB Connected successfully!");
    try {
      console.log("📡 Running self-healing schema check on users table...");
      
      // Check & Add isSultan
      const [hasIsSultan]: any = await conn.execute("SHOW COLUMNS FROM users LIKE 'isSultan'");
      if (hasIsSultan.length === 0) {
        console.log("🛠️  Column 'isSultan' is missing. Altering table...");
        await conn.execute("ALTER TABLE users ADD COLUMN isSultan TINYINT(1) DEFAULT 0");
        console.log("   → Column 'isSultan' added successfully!");
      }

      // Check & Add sultanExpiry
      const [hasSultanExpiry]: any = await conn.execute("SHOW COLUMNS FROM users LIKE 'sultanExpiry'");
      if (hasSultanExpiry.length === 0) {
        console.log("🛠️  Column 'sultanExpiry' is missing. Altering table...");
        await conn.execute("ALTER TABLE users ADD COLUMN sultanExpiry TIMESTAMP NULL DEFAULT NULL");
        console.log("   → Column 'sultanExpiry' added successfully!");
      }

      // ─── SELF-HEALING PRODUCTS TABLE ─────────────────────────────────────
      console.log("📡 Running self-healing schema check on products table...");
      // Ensure table exists
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INT PRIMARY KEY AUTO_INCREMENT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      const userMembershipColumns = [
        { name: "isAISubscriber", type: "TINYINT(1) DEFAULT 0" },
        { name: "aiSubscriptionExpiry", type: "TIMESTAMP NULL DEFAULT NULL" },
      ];
      for (const col of userMembershipColumns) {
        const [hasCol]: any = await conn.execute(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
        if (hasCol.length === 0) {
          await conn.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        }
      }

      const companionModelColumns = [
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS modelId VARCHAR(255) NOT NULL",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS description TEXT NULL",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS color VARCHAR(30) DEFAULT '#6366f1'",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS isEnabled TINYINT(1) DEFAULT 1",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS isReleased TINYINT(1) DEFAULT 0",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS accessLevel VARCHAR(20) DEFAULT 'pro'",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS sortOrder INT DEFAULT 0",
        "ALTER TABLE ai_companion_models ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      ];
      for (const query of companionModelColumns) {
        try {
          await conn.execute(query);
        } catch (err: any) {
          console.warn("AI companion models column check warning:", err.message);
        }
      }

      const productsAlterColumns = [
        "ADD COLUMN IF NOT EXISTS name            VARCHAR(255)    NULL",
        "ADD COLUMN IF NOT EXISTS description     TEXT            NULL",
        "ADD COLUMN IF NOT EXISTS longDescription TEXT            NULL",
        "ADD COLUMN IF NOT EXISTS price           DECIMAL(15,2)   NOT NULL DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS image           VARCHAR(500)    NULL",
        "ADD COLUMN IF NOT EXISTS images          JSON            NULL",
        "ADD COLUMN IF NOT EXISTS category        VARCHAR(100)    NULL",
        "ADD COLUMN IF NOT EXISTS specs           JSON            NULL",
        "ADD COLUMN IF NOT EXISTS stock           INT             DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS sellerId        VARCHAR(255)    NULL",
        "ADD COLUMN IF NOT EXISTS sellerName      VARCHAR(255)    NULL",
        "ADD COLUMN IF NOT EXISTS status          ENUM('pending','approved','rejected') DEFAULT 'pending'",
        "ADD COLUMN IF NOT EXISTS isFlashSale     BOOLEAN         DEFAULT FALSE",
        "ADD COLUMN IF NOT EXISTS discountPercent INT             DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS isPreOrder      BOOLEAN         DEFAULT FALSE",
        "ADD COLUMN IF NOT EXISTS releaseDate     VARCHAR(50)     NULL",
      ];

      for (const col of productsAlterColumns) {
        try {
          await conn.execute(`ALTER TABLE products ${col}`);
        } catch (e) {}
      }
      console.log("   → Products table is fully verified!");

      // ─── SELF-HEALING ANDROID PACKAGES TABLE ─────────────────────────────────────
      console.log("📡 Running self-healing schema check on android_packages table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS android_packages (
          id INT PRIMARY KEY AUTO_INCREMENT,
          version_name VARCHAR(255) NOT NULL,
          version_code INT NOT NULL,
          changelog TEXT NOT NULL,
          file_url VARCHAR(500) NULL,
          file_hash VARCHAR(255) NULL,
          build_status ENUM('queued','building','success','failed') DEFAULT 'queued' NOT NULL,
          release_status ENUM('draft','latest') DEFAULT 'draft' NOT NULL,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → Android packages table is fully verified!");

      // ─── SELF-HEALING USERS CRYPTO COLUMNS ─────────────────────────────────
      console.log("📡 Running self-healing schema check on users crypto columns...");
      const usersCryptoCols = [
        { name: "myCoinNft", type: "VARCHAR(255) DEFAULT '0'" },
        { name: "balanceBtc", type: "VARCHAR(255) DEFAULT '1.42'" },
        { name: "balanceEth", type: "VARCHAR(255) DEFAULT '8.50'" },
        { name: "balanceUsdt", type: "VARCHAR(255) DEFAULT '500.00'" },
      ];
      for (const col of usersCryptoCols) {
        const [hasCol]: any = await conn.execute(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
        if (hasCol.length === 0) {
          console.log(`🛠️  Column '${col.name}' is missing. Altering table users...`);
          await conn.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
          console.log(`   → Column '${col.name}' added successfully!`);
        }
      }

      // ─── SELF-HEALING NFTS TABLE ───────────────────────────────────────────
      console.log("📡 Running self-healing schema check on nfts table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS nfts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          image VARCHAR(500) NOT NULL,
          price_crypto VARCHAR(50) NOT NULL,
          crypto_type VARCHAR(20) NOT NULL,
          price_mcnft VARCHAR(50) NOT NULL,
          owner_id VARCHAR(255) NULL,
          is_for_sale TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → Nfts table is fully verified!");

      const [existingNfts]: any = await conn.execute("SELECT COUNT(*) as count FROM nfts");
      if (existingNfts[0].count === 0) {
        console.log("🌱 Seeding initial premium NFTs...");
        await conn.execute(`
          INSERT INTO nfts (name, description, image, price_crypto, crypto_type, price_mcnft, owner_id, is_for_sale) VALUES
          ('Arthur Cyber Syndicate #001', 'Sindikasi cyber elite dari era neo-Arthur yang terinkubasi langsung dalam server utama.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop', '0.25', 'BTC', '250', NULL, 1),
          ('Antigravity Overlord Node', 'Simulasi node otonom yang dikembangkan secara rahasia oleh Google DeepMind Antigravity.', 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop', '1.50', 'ETH', '75', NULL, 1),
          ('Genesis Cynmatic Protocol', 'Blok asal mula Cynmatic network yang membawa kekayaan algoritma dewa.', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&auto=format&fit=crop', '0.50', 'BTC', '500', NULL, 1),
          ('Neo-Arthur Laser Sabre', 'Aset laser digital legendaris milik ksatria Arthur di dunia grid.', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&auto=format&fit=crop', '2.00', 'ETH', '100', NULL, 1),
          ('Matrix Grid Cyber Sphere', 'Inti pertahanan digital yang menjaga integritas saldo pengguna TokoArthur.', 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop', '50.00', 'USDT', '50', NULL, 1)
        `);
        console.log("   → Premium NFTs seeded successfully!");
      }

      // ─── SELF-HEALING VOUCHERS TABLE COLUMNS ──────────────────────────────
      console.log("📡 Running self-healing schema check on vouchers table...");
      const vouchersNewCols = [
        { name: "sellerId", type: "VARCHAR(255) NULL" },
        { name: "sellerName", type: "VARCHAR(255) NULL" },
        { name: "productId", type: "INT NULL" },
        { name: "productName", type: "VARCHAR(255) NULL" },
      ];
      for (const col of vouchersNewCols) {
        const [hasCol]: any = await conn.execute(`SHOW COLUMNS FROM vouchers LIKE '${col.name}'`);
        if (hasCol.length === 0) {
          console.log(`🛠️  Column '${col.name}' is missing. Altering table vouchers...`);
          await conn.execute(`ALTER TABLE vouchers ADD COLUMN ${col.name} ${col.type}`);
          console.log(`   → Column '${col.name}' added successfully to vouchers!`);
        }
      }

      // ─── SELF-HEALING ORDERS TABLE COLUMNS ───────────────────────────────
      console.log("📡 Running self-healing schema check on orders table...");
      const ordersNewCols = [
        { name: "sellerVoucherCode", type: "VARCHAR(100) NULL" },
        { name: "sellerVoucherDiscount", type: "INT NULL" },
      ];
      for (const col of ordersNewCols) {
        const [hasCol]: any = await conn.execute(`SHOW COLUMNS FROM orders LIKE '${col.name}'`);
        if (hasCol.length === 0) {
          console.log(`🛠️  Column '${col.name}' is missing. Altering table orders...`);
          await conn.execute(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
          console.log(`   → Column '${col.name}' added successfully to orders!`);
        }
      }

      // ─── SELF-HEALING COLLAB REQUESTS TABLE ─────────────────────────────
      console.log("📡 Running self-healing schema check on collab_requests table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS collab_requests (
          id VARCHAR(255) PRIMARY KEY,
          fromSellerId VARCHAR(255) NOT NULL,
          fromSellerName VARCHAR(255) NOT NULL,
          toSellerId VARCHAR(255) NOT NULL,
          toSellerName VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          createdAt VARCHAR(255) NOT NULL,
          responseAt VARCHAR(255) NULL,
          productId INT NULL,
          productName VARCHAR(255) NULL,
          productPrice DECIMAL(15,2) NULL,
          productImage VARCHAR(500) NULL,
          proposedPrice DECIMAL(15,2) NULL,
          proposedQuantity INT NULL,
          commissionPercent INT NULL,
          feedbackMessage TEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → Collab requests table is fully verified!");

      console.log("📡 Running self-healing schema check on friend groups tables...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS friend_groups (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          ownerId VARCHAR(255) NOT NULL,
          memberIds JSON NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_friend_groups_owner (ownerId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS group_messages (
          id VARCHAR(255) PRIMARY KEY,
          groupId VARCHAR(255) NOT NULL,
          senderId VARCHAR(255) NOT NULL,
          text TEXT NULL,
          mediaUrl VARCHAR(500) NULL,
          mediaType VARCHAR(20) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_group_messages_group_created (groupId, createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → Friend groups tables are fully verified!");

      // ─── SELF-HEALING AI SETTINGS TABLE ──────────────────────────────────
      console.log("📡 Running self-healing schema check on ai_settings table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_settings (
          id VARCHAR(255) PRIMARY KEY,
          aiProvider VARCHAR(50) DEFAULT 'openrouter',
          openrouterKey TEXT NULL,
          openrouterModel VARCHAR(255) NULL,
          obscuraKey TEXT NULL,
          obscuraModel VARCHAR(255) NULL,
          aiChatDailyLimit INT DEFAULT 20,
          aiCompanionDailyLimit INT DEFAULT 10
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // ─── SELF-HEALING AI ANALYSIS HISTORY TABLE ────────────────────────────
      console.log("📡 Running self-healing schema check on ai_analysis_history table...");
      const aiSettingsColumns = [
        { name: "aiProvider", type: "VARCHAR(50) DEFAULT 'openrouter'" },
        { name: "obscuraKey", type: "TEXT NULL" },
        { name: "obscuraModel", type: "VARCHAR(255) NULL" },
        { name: "aiChatDailyLimit", type: "INT DEFAULT 20" },
        { name: "aiCompanionDailyLimit", type: "INT DEFAULT 10" },
      ];
      for (const col of aiSettingsColumns) {
        const [hasCol]: any = await conn.execute(`SHOW COLUMNS FROM ai_settings LIKE '${col.name}'`);
        if (hasCol.length === 0) {
          await conn.execute(`ALTER TABLE ai_settings ADD COLUMN ${col.name} ${col.type}`);
        }
      }

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_usage_limits (
          id VARCHAR(255) PRIMARY KEY,
          userId VARCHAR(255) NOT NULL,
          scope VARCHAR(50) NOT NULL,
          usageDate VARCHAR(20) NOT NULL,
          usedCount INT DEFAULT 0,
          estimatedTokens INT DEFAULT 0,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ai_usage_user_scope_date (userId, scope, usageDate)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      const [hasEstimatedTokens]: any = await conn.execute("SHOW COLUMNS FROM ai_usage_limits LIKE 'estimatedTokens'");
      if (hasEstimatedTokens.length === 0) {
        await conn.execute("ALTER TABLE ai_usage_limits ADD COLUMN estimatedTokens INT DEFAULT 0 AFTER usedCount");
      }

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_chat_sessions (
          id VARCHAR(255) PRIMARY KEY,
          userId VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          messages JSON NOT NULL,
          createdAtMs BIGINT NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ai_chat_sessions_user_updated (userId, updatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_companion_sessions (
          id VARCHAR(255) PRIMARY KEY,
          userId VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          messages JSON NOT NULL,
          createdAtMs BIGINT NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ai_companion_sessions_user_updated (userId, updatedAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_subscription_plans (
          id VARCHAR(255) PRIMARY KEY,
          price INT NOT NULL DEFAULT 15000,
          durations JSON NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await conn.execute(`
        INSERT IGNORE INTO ai_subscription_plans (id, price, durations) VALUES (
          'global',
          15000,
          JSON_ARRAY(
            JSON_OBJECT('label', '1 Bulan', 'months', 1),
            JSON_OBJECT('label', '3 Bulan', 'months', 3),
            JSON_OBJECT('label', '6 Bulan', 'months', 6),
            JSON_OBJECT('label', '1 Tahun', 'months', 12)
          )
        )
      `);

      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_analysis_history (
          id          VARCHAR(255) PRIMARY KEY,
          ticketId    VARCHAR(255) NOT NULL,
          userId      VARCHAR(255) NOT NULL,
          userName    VARCHAR(255) NOT NULL,
          sentiment   VARCHAR(50) NOT NULL,
          tags        JSON NOT NULL,
          summary     TEXT NOT NULL,
          description TEXT NOT NULL,
          aiResponse  TEXT NULL,
          createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      try {
        await conn.execute(`
          ALTER TABLE ai_analysis_history ADD COLUMN IF NOT EXISTS aiResponse TEXT NULL
        `);
      } catch (err: any) {
        console.warn("⚠️ Non-blocking alter table warning (aiResponse):", err.message);
      }
      // ─── SELF-HEALING GACHA REWARDS TABLE ──────────────────────────────────
      console.log("📡 Running self-healing schema check on gacha_rewards table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS gacha_rewards (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          value VARCHAR(255) NOT NULL,
          tier VARCHAR(50) NOT NULL,
          chance DECIMAL(5,2) NOT NULL,
          image VARCHAR(500) NULL,
          isActive TINYINT(1) DEFAULT 1,
          eventType VARCHAR(50) DEFAULT 'royale',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      // Run manual ALTER TABLE to ensure eventType exists in existing table (self-healing migration)
      try {
        await conn.execute(`
          ALTER TABLE gacha_rewards ADD COLUMN IF NOT EXISTS eventType VARCHAR(50) DEFAULT 'royale'
        `);
      } catch (err: any) {
        console.warn("⚠️ Non-blocking alter table warning (eventType):", err.message);
      }
      console.log("   → Gacha rewards table is fully verified!");

      const [existingRewards]: any = await conn.execute("SELECT COUNT(*) as count FROM gacha_rewards");
      if (existingRewards[0].count === 0) {
        console.log("🌱 Seeding initial gacha rewards...");
        await conn.execute(`
          INSERT INTO gacha_rewards (name, type, value, tier, chance, image, isActive, eventType) VALUES
          ('FLAMING HOLLOWFACE BUNDLE (Mythic)', 'item', 'FLAMING BUNDLE', 'mythic', 0.50, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500', 1, 'mystery'),
          ('Sultan Gold Badge Effect (Legendary)', 'custom_badge', 'sultan_gold', 'legendary', 1.50, 'https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=500', 1, 'mystery'),
          ('Arthur Cyber Emote (Epic)', 'item', 'CYBER EMOTE', 'epic', 5.00, 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=500', 1, 'faded'),
          ('10,000 Koin Toko (Rare)', 'coins', '10000', 'rare', 10.00, 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500', 1, 'faded'),
          ('1,000 Koin Toko (Common)', 'coins', '1000', 'common', 33.00, 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500', 1, 'royale'),
          ('500 Koin Toko (Common)', 'coins', '500', 'common', 50.00, 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500', 1, 'royale')
        `);
        console.log("   → Gacha rewards seeded successfully!");
      } else {
        // Self-healing migration to seed categories for existing data if they are all default 'royale'
        try {
          const [allRoyale]: any = await conn.execute("SELECT COUNT(*) as count FROM gacha_rewards WHERE eventType = 'royale'");
          const [totalCount]: any = await conn.execute("SELECT COUNT(*) as count FROM gacha_rewards");
          if (allRoyale[0].count === totalCount[0].count && totalCount[0].count > 0) {
            console.log("🛠️ Distributing default rewards into gacha categories...");
            await conn.execute("UPDATE gacha_rewards SET eventType = 'mystery' WHERE tier = 'mythic' OR type = 'custom_badge'");
            await conn.execute("UPDATE gacha_rewards SET eventType = 'faded' WHERE tier IN ('epic', 'rare')");
          }
        } catch (err: any) {
          console.warn("⚠️ Non-blocking category redistribution warning:", err.message);
        }
      }

      // ─── SELF-HEALING AI COMPANION MODELS TABLE ──────────────────────────
      console.log("📡 Running self-healing schema check on ai_companion_models table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_companion_models (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          modelId VARCHAR(255) NOT NULL,
          description TEXT NULL,
          color VARCHAR(30) DEFAULT '#6366f1',
          isEnabled TINYINT(1) DEFAULT 1,
          sortOrder INT DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → ai_companion_models table is fully verified!");

      console.log("✅ Users, Products, Android Packages, NFTs, Vouchers, Orders, Collab Requests, AI Settings, Gacha Rewards & AI Companion Models table schemas are fully verified & up to date.");
      console.log("📡 Running self-healing schema check on AI characters tables...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_characters (
          id VARCHAR(255) PRIMARY KEY,
          ownerId VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          tagline VARCHAR(180) NULL,
          avatar VARCHAR(500) NULL,
          personality TEXT NOT NULL,
          greeting TEXT NULL,
          visibility VARCHAR(20) DEFAULT 'private',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ai_characters_owner_visibility (ownerId, visibility)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_character_sessions (
          id VARCHAR(255) PRIMARY KEY,
          characterId VARCHAR(255) NOT NULL,
          userId VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          messages JSON NOT NULL,
          createdAtMs BIGINT NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ai_character_sessions_user_updated (userId, updatedAt),
          INDEX idx_ai_character_sessions_character (characterId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → AI characters tables are fully verified!");

      console.log("📡 Running self-healing schema check on ai_knowledge table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_knowledge (
          id VARCHAR(255) PRIMARY KEY,
          keyword VARCHAR(255) NOT NULL UNIQUE,
          content TEXT NOT NULL,
          createdBy VARCHAR(255) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → ai_knowledge table is fully verified!");
    } catch (schemaErr: any) {
      console.warn("⚠️  Self-healing schema migration check failed (non-blocking):", schemaErr.message);
    } finally {
      conn.release();
    }
  })
  .catch(err => {
    console.error("❌ MariaDB Connection FAILED:", err.message);
    console.error("   Check your DATABASE_URL in .env:");
    console.error("   DATABASE_URL=mysql://user:pass@host:3306/dbname");
  });

export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
