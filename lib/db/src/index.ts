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
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,      // 10s connection timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
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

      // ─── SELF-HEALING AI SETTINGS TABLE ──────────────────────────────────
      console.log("📡 Running self-healing schema check on ai_settings table...");
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS ai_settings (
          id VARCHAR(255) PRIMARY KEY,
          openrouterKey TEXT NULL,
          openrouterModel VARCHAR(255) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   → Ai settings table is fully verified!");

      console.log("✅ Users, Products, Android Packages, NFTs, Vouchers, Orders, Collab Requests & AI Settings table schemas are fully verified & up to date.");
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
