import mysql from 'mysql2/promise';

async function testMigrate() {
  console.log("🔗 Testing direct migration to VPS MariaDB...");
  
  try {
    const connection = await mysql.createConnection({
      host: '185.128.227.237',
      user: 'root',
      password: 'phantomichostjaya',
      database: 'cynmatic_db'
    });

    console.log("✅ Connected to VPS MariaDB!");
    
    // Test insert a user
    await connection.query(`
      INSERT INTO users (id, name, email, role, isVerifiedSeller, isVerifiedReseller, coins)
      VALUES ('test-conn-check', 'Connection Test', 'test@conn.check', 'user', 0, 0, 0)
      ON DUPLICATE KEY UPDATE name='Connection Test'
    `);
    console.log("✅ Test user inserted!");

    // Check tables
    const [tables] = await connection.query("SHOW TABLES");
    console.log("📋 Tables in cynmatic_db:", tables);
    
    // Clean up test data
    await connection.query("DELETE FROM users WHERE id = 'test-conn-check'");
    console.log("🧹 Test data cleaned up");
    
    await connection.end();
    console.log("\n🎉 EVERYTHING WORKS! VPS is ready for migration.");
  } catch (error) {
    console.error("❌ FAILED:", error.message);
  }
}

testMigrate();
