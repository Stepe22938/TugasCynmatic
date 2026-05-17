/**
 * setup_mariadb.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Run this script ONCE to create the database and all tables on the VPS.
 * 
 * Usage:
 *   node scripts/setup_mariadb.js
 * ─────────────────────────────────────────────────────────────────────────────
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

// Parse URL → extract DB name to create DB first without specifying it
const urlWithoutDb = DB_URL.replace(/\/([^/?]+)(\?.*)?$/, '/');
const dbName = DB_URL.match(/\/([^/?]+)(\?.*)?$/)?.[1];

if (!dbName) {
  console.error('❌ Cannot parse database name from DATABASE_URL');
  process.exit(1);
}

console.log(`🔌 Connecting to MariaDB (db: ${dbName})...`);

async function run() {
  // Connect without specifying database first
  const url2 = DB_URL.replace(/^mysql:\/\//, 'mysql2://').replace(new RegExp(`/${dbName}.*$`), '/');
  const conn = await mysql.createConnection(url2 + '?connectTimeout=10000');

  try {
    // 1. Create database
    console.log(`📦 Creating database '${dbName}' if not exists...`);
    await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.execute(`USE \`${dbName}\``);
    console.log(`✅ Using database: ${dbName}`);

    // 2. USERS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id              VARCHAR(255) PRIMARY KEY,
        name            VARCHAR(255) NOT NULL,
        email           VARCHAR(255) NOT NULL UNIQUE,
        password        VARCHAR(255),
        role            ENUM('user','seller','admin','kurir') DEFAULT 'user',
        isVerifiedSeller    BOOLEAN DEFAULT FALSE,
        isVerifiedReseller  BOOLEAN DEFAULT FALSE,
        coins           BIGINT DEFAULT 0,
        balance         TEXT DEFAULT '0',
        points          INT DEFAULT 0,
        isBanned        BOOLEAN DEFAULT FALSE,
        banReason       TEXT,
        banType         VARCHAR(20),
        banExpiry       TIMESTAMP NULL,
        activityLog       JSON,
        purchaseHistory   JSON,
        ownedCosmetics    JSON,
        equippedCosmetics JSON,
        walletTransactions JSON,
        sultanBadgeColor  VARCHAR(50),
        sultanGlowEffect  BOOLEAN DEFAULT FALSE,
        sultanCustomTag   VARCHAR(100),
        isMyCryptoMember  BOOLEAN DEFAULT FALSE,
        myCryptoExpiry    TIMESTAMP NULL,
        bio             TEXT,
        theme           VARCHAR(255) DEFAULT 'from-primary to-orange-600',
        youtubeId       VARCHAR(50),
        useAnimation    BOOLEAN DEFAULT FALSE,
        createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add new columns to pre-existing users table (safe: IF NOT EXISTS)
    const userAlterColumns = [
      "ADD COLUMN IF NOT EXISTS systemId        INT             NULL",
      "ADD COLUMN IF NOT EXISTS friends         JSON            NULL",
      "ADD COLUMN IF NOT EXISTS friendRequests  JSON            NULL",
      "ADD COLUMN IF NOT EXISTS sentRequests    JSON            NULL",
      "ADD COLUMN IF NOT EXISTS referralCode    VARCHAR(50)     NULL",
      "ADD COLUMN IF NOT EXISTS referredBy      VARCHAR(255)    NULL",
      "ADD COLUMN IF NOT EXISTS isBanned        BOOLEAN         DEFAULT FALSE",
      "ADD COLUMN IF NOT EXISTS banReason       TEXT            NULL",
      "ADD COLUMN IF NOT EXISTS banType         VARCHAR(20)     NULL",
      "ADD COLUMN IF NOT EXISTS banExpiry       TIMESTAMP       NULL",
      "ADD COLUMN IF NOT EXISTS profileLayout   VARCHAR(20)     DEFAULT 'premium'",
      "ADD COLUMN IF NOT EXISTS avatar          VARCHAR(500)    NULL",
    ];

    for (const col of userAlterColumns) {
      try {
        await conn.execute(`ALTER TABLE users ${col}`);
      } catch (e) {
        // Ignore "Duplicate column" errors — column already exists
      }
    }
    console.log('✅ Table: users');

    // 3. PRODUCTS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id              INT PRIMARY KEY AUTO_INCREMENT,
        name            VARCHAR(255) NOT NULL,
        description     TEXT,
        longDescription TEXT,
        price           DECIMAL(15,2) NOT NULL DEFAULT 0,
        image           VARCHAR(500),
        images          JSON,
        category        VARCHAR(100),
        specs           JSON,
        stock           INT DEFAULT 0,
        sellerId        VARCHAR(255),
        sellerName      VARCHAR(255),
        status          ENUM('pending','approved','rejected') DEFAULT 'pending',
        isFlashSale     BOOLEAN DEFAULT FALSE,
        discountPercent INT DEFAULT 0,
        isPreOrder      BOOLEAN DEFAULT FALSE,
        releaseDate     VARCHAR(50),
        createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: products');

    // 4. ORDERS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id              VARCHAR(255) PRIMARY KEY,
        userId          VARCHAR(255) NOT NULL,
        userName        VARCHAR(255),
        orderNumber     VARCHAR(100) NOT NULL,
        date            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        items           JSON NOT NULL,
        subtotal        DECIMAL(15,2),
        shippingFee     DECIMAL(15,2),
        grandTotal      DECIMAL(15,2),
        status          VARCHAR(50) DEFAULT 'placed',
        shippingInfo    JSON,
        paymentMethod   VARCHAR(50),
        voucherCode     VARCHAR(100),
        voucherDiscount INT,
        coinDiscount    INT,
        messages        JSON,
        problemReport   TEXT,
        courierNote     TEXT,
        reviews         JSON
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: orders');

    // 5. REVIEWS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id          INT PRIMARY KEY AUTO_INCREMENT,
        productId   INT NOT NULL,
        orderId     VARCHAR(255) NOT NULL,
        userName    VARCHAR(255),
        rating      INT NOT NULL,
        status      VARCHAR(50),
        comment     TEXT,
        mediaFiles  JSON,
        createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_review (productId, orderId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: reviews');

    // 6. AUCTIONS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS auctions (
        id            VARCHAR(255) PRIMARY KEY,
        sellerId      VARCHAR(255) NOT NULL,
        sellerName    VARCHAR(255),
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        imageUrl      VARCHAR(500),
        startPrice    DECIMAL(15,2),
        currentPrice  DECIMAL(15,2),
        minStep       DECIMAL(15,2),
        endTime       TIMESTAMP NULL,
        status        VARCHAR(20) DEFAULT 'active',
        bids          JSON,
        winnerId      VARCHAR(255),
        winnerName    VARCHAR(255),
        isPaid        BOOLEAN DEFAULT FALSE,
        createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: auctions');

    // 7. POLLS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS polls (
        id            VARCHAR(255) PRIMARY KEY,
        title         VARCHAR(255) NOT NULL,
        options       JSON NOT NULL,
        isActive      BOOLEAN DEFAULT TRUE,
        votedUserIds  JSON,
        createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: polls');

    // 8. TICKETS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id          VARCHAR(255) PRIMARY KEY,
        userId      VARCHAR(255) NOT NULL,
        userName    VARCHAR(255),
        subject     VARCHAR(255) NOT NULL,
        description TEXT,
        category    VARCHAR(100),
        priority    VARCHAR(20) DEFAULT 'medium',
        status      VARCHAR(20) DEFAULT 'open',
        messages    JSON,
        createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: tickets');

    // 9. VOUCHERS TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id          VARCHAR(255) PRIMARY KEY,
        code        VARCHAR(100) NOT NULL UNIQUE,
        type        VARCHAR(20) NOT NULL,
        value       DECIMAL(15,2) NOT NULL,
        minPurchase DECIMAL(15,2) DEFAULT 0,
        maxDiscount DECIMAL(15,2),
        expiresAt   TIMESTAMP NULL,
        maxUses     INT DEFAULT 0,
        usedCount   INT DEFAULT 0,
        isActive    BOOLEAN DEFAULT TRUE,
        description TEXT,
        createdAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: vouchers');

    // 10. REDEEM CODES TABLE
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS redeem_codes (
        id        VARCHAR(255) PRIMARY KEY,
        code      VARCHAR(100) NOT NULL UNIQUE,
        type      VARCHAR(20) NOT NULL,
        value     DECIMAL(15,2) NOT NULL,
        maxUses   INT DEFAULT 0,
        usedBy    JSON,
        isActive  BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table: redeem_codes');

    // 11. Seed default accounts (only use columns guaranteed present in ALL schema versions)
    console.log('\n👤 Seeding default accounts...');

    await conn.execute(`
      INSERT IGNORE INTO users
        (id, name, email, password, role, coins, balance, points,
         isVerifiedSeller,
         activityLog, purchaseHistory, ownedCosmetics, equippedCosmetics, walletTransactions)
      VALUES
        ('admin-001', 'Cynmatic Admin', 'admin@cynmatic.com', 'admin', 'admin',
         1000000, '1000000', 10000,
         TRUE,
         '[]', '[]', '[]', '[]', '[]')
    `);

    await conn.execute(`
      INSERT IGNORE INTO users
        (id, name, email, password, role, coins, balance, points,
         activityLog, purchaseHistory, ownedCosmetics, equippedCosmetics, walletTransactions)
      VALUES
        ('user-001', 'Test User', 'user@cynmatic.com', 'user', 'user',
         50000, '0', 500,
         '[]', '[]', '[]', '[]', '[]')
    `);

    // Update referralCode separately (it was just added by ALTER TABLE above)
    await conn.execute(`UPDATE users SET referralCode = 'CYN-ADMIN'  WHERE id = 'admin-001' AND (referralCode IS NULL OR referralCode = '')`);
    await conn.execute(`UPDATE users SET referralCode = 'CYN-TESTUS' WHERE id = 'user-001'  AND (referralCode IS NULL OR referralCode = '')`);
    await conn.execute(`UPDATE users SET friends = '[]', friendRequests = '[]', sentRequests = '[]' WHERE id IN ('admin-001','user-001') AND friends IS NULL`);

    console.log('✅ Default accounts seeded.');


    console.log('\n🎉 ========================================');
    console.log('   MariaDB setup COMPLETE!');
    console.log('   Database:', dbName);
    console.log('   Tables created: 10');
    console.log('   Default accounts seeded.');
    console.log('========================================');
    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin: admin@cynmatic.com / admin');
    console.log('   User:  user@cynmatic.com  / user');
    console.log('\n🚀 Now run: npm run dev\n');

  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('\n❌ Setup FAILED:', err.message);
  console.error('\nCommon fixes:');
  console.error('  1. Check DATABASE_URL in .env');
  console.error('  2. Ensure MariaDB is running on VPS (port 3306)');
  console.error('  3. Check firewall allows your IP to connect to port 3306');
  console.error('  4. Verify user has CREATE DATABASE permission');
  process.exit(1);
});
