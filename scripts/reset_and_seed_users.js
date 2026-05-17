/**
 * reset_and_seed_users.js
 * -----------------------
 * Hapus SEMUA user dari database VPS, lalu buat 4 akun baru:
 *  - Admin    : admin@cynmatic.com   / admin
 *  - Seller   : seller@cynmatic.com  / seller
 *  - Kurir    : kurir@cynmatic.com   / kurir
 *  - User     : user@cynmatic.com    / user
 *
 * Usage: node scripts/reset_and_seed_users.js
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

const now = new Date().toISOString();

const SEED_USERS = [
  {
    id: 'admin-001',
    name: 'Cynmatic Admin',
    email: 'admin@cynmatic.com',
    password: 'admin',
    role: 'admin',
    coins: 1000000,
    balance: '1000000',
    points: 10000,
    isVerifiedSeller: true,
    isVerifiedReseller: false,
    isBanned: false,
    banReason: null,
    banType: null,
    banExpiry: null,
    friends: '[]',
    friendRequests: '[]',
    sentRequests: '[]',
    activityLog: '[]',
    purchaseHistory: '[]',
    ownedCosmetics: '[]',
    equippedCosmetics: '[]',
    walletTransactions: '[]',
    referralCode: 'CYN-ADMIN',
    referredBy: null,
    isSultan: false,
    bio: 'Administrator Cynmatic',
    theme: 'from-yellow-600 to-amber-900',
    youtubeId: null,
    useAnimation: false,
    profileLayout: 'premium',
    avatar: null,
    isMyCryptoMember: false,
    myCryptoExpiry: null,
    sultanBadgeColor: null,
    sultanGlowEffect: false,
    sultanCustomTag: null,
  },
  {
    id: 'seller-001',
    name: 'Cynmatic Seller',
    email: 'seller@cynmatic.com',
    password: 'seller',
    role: 'seller',
    coins: 50000,
    balance: '500000',
    points: 1000,
    isVerifiedSeller: true,
    isVerifiedReseller: false,
    isBanned: false,
    banReason: null,
    banType: null,
    banExpiry: null,
    friends: '[]',
    friendRequests: '[]',
    sentRequests: '[]',
    activityLog: '[]',
    purchaseHistory: '[]',
    ownedCosmetics: '[]',
    equippedCosmetics: '[]',
    walletTransactions: '[]',
    referralCode: 'CYN-SELLER',
    referredBy: null,
    isSultan: false,
    bio: 'Official Cynmatic Seller',
    theme: 'from-green-600 to-teal-900',
    youtubeId: null,
    useAnimation: false,
    profileLayout: 'premium',
    avatar: null,
    isMyCryptoMember: false,
    myCryptoExpiry: null,
    sultanBadgeColor: null,
    sultanGlowEffect: false,
    sultanCustomTag: null,
  },
  {
    id: 'kurir-001',
    name: 'Cynmatic Kurir',
    email: 'kurir@cynmatic.com',
    password: 'kurir',
    role: 'kurir',
    coins: 20000,
    balance: '0',
    points: 500,
    isVerifiedSeller: false,
    isVerifiedReseller: false,
    isBanned: false,
    banReason: null,
    banType: null,
    banExpiry: null,
    friends: '[]',
    friendRequests: '[]',
    sentRequests: '[]',
    activityLog: '[]',
    purchaseHistory: '[]',
    ownedCosmetics: '[]',
    equippedCosmetics: '[]',
    walletTransactions: '[]',
    referralCode: 'CYN-KURIR',
    referredBy: null,
    isSultan: false,
    bio: 'Kurir resmi Cynmatic',
    theme: 'from-blue-600 to-indigo-900',
    youtubeId: null,
    useAnimation: false,
    profileLayout: 'premium',
    avatar: null,
    isMyCryptoMember: false,
    myCryptoExpiry: null,
    sultanBadgeColor: null,
    sultanGlowEffect: false,
    sultanCustomTag: null,
  },
  {
    id: 'user-001',
    name: 'Cynmatic User',
    email: 'user@cynmatic.com',
    password: 'user',
    role: 'user',
    coins: 20000,
    balance: '0',
    points: 100,
    isVerifiedSeller: false,
    isVerifiedReseller: false,
    isBanned: false,
    banReason: null,
    banType: null,
    banExpiry: null,
    friends: '[]',
    friendRequests: '[]',
    sentRequests: '[]',
    activityLog: '[]',
    purchaseHistory: '[]',
    ownedCosmetics: '[]',
    equippedCosmetics: '[]',
    walletTransactions: '[]',
    referralCode: 'CYN-TESTUS',
    referredBy: null,
    isSultan: false,
    bio: 'Member Cynmatic',
    theme: 'from-violet-600 to-indigo-900',
    youtubeId: null,
    useAnimation: false,
    profileLayout: 'premium',
    avatar: null,
    isMyCryptoMember: false,
    myCryptoExpiry: null,
    sultanBadgeColor: null,
    sultanGlowEffect: false,
    sultanCustomTag: null,
  }
];

async function run() {
  let conn;
  try {
    conn = await mysql.createConnection(DB_URL);
    console.log('✅ Connected to VPS MariaDB:', DB_URL.replace(/:([^:@]+)@/, ':***@'));

    // ─── HAPUS SEMUA USER ────────────────────────────────────────────────────
    console.log('\n🗑️  Menghapus semua user...');
    const [delResult] = await conn.execute('DELETE FROM users');
    console.log(`   → ${delResult.affectedRows} user dihapus.`);

    // ─── INSERT ULANG 4 AKUN FRESH ───────────────────────────────────────────
    console.log('\n👤 Menyisipkan akun baru...');
    for (const u of SEED_USERS) {
      await conn.execute(
        `INSERT INTO users (
          id, name, email, password, role,
          coins, balance, points,
          isVerifiedSeller, isVerifiedReseller,
          isBanned, banReason, banType, banExpiry,
          friends, friendRequests, sentRequests,
          activityLog, purchaseHistory, ownedCosmetics,
          equippedCosmetics, walletTransactions,
          referralCode, referredBy,
          isSultan, bio, theme, youtubeId, useAnimation,
          profileLayout, avatar,
          isMyCryptoMember, myCryptoExpiry,
          sultanBadgeColor, sultanGlowEffect, sultanCustomTag
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?
        )`,
        [
          u.id, u.name, u.email, u.password, u.role,
          u.coins, u.balance, u.points,
          u.isVerifiedSeller, u.isVerifiedReseller,
          u.isBanned, u.banReason, u.banType, u.banExpiry,
          u.friends, u.friendRequests, u.sentRequests,
          u.activityLog, u.purchaseHistory, u.ownedCosmetics,
          u.equippedCosmetics, u.walletTransactions,
          u.referralCode, u.referredBy,
          u.isSultan, u.bio, u.theme, u.youtubeId, u.useAnimation,
          u.profileLayout, u.avatar,
          u.isMyCryptoMember, u.myCryptoExpiry,
          u.sultanBadgeColor, u.sultanGlowEffect, u.sultanCustomTag,
        ]
      );
      console.log(`   ✅ ${u.role.toUpperCase().padEnd(8)} → ${u.email} / ${u.password}`);
    }

    console.log('\n🎉 Selesai! Database sudah bersih. Akun fresh siap dipakai:\n');
    console.log('   Role     | Email                  | Password');
    console.log('   ---------|------------------------|----------');
    SEED_USERS.forEach(u => {
      console.log(`   ${u.role.padEnd(8)} | ${u.email.padEnd(22)} | ${u.password}`);
    });
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

run();
