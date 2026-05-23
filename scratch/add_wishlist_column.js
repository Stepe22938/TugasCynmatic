const mysql = require('mysql2/promise');

async function updateDb() {
    const connection = await mysql.createConnection("mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db");
    
    console.log("Adding wishlist column to VPS MariaDB users table...");
    
    try {
        await connection.query("ALTER TABLE users ADD COLUMN wishlist JSON DEFAULT NULL AFTER walletTransactions");
        console.log("Added 'wishlist' column.");
    } catch (e) {
        console.log("wishlist column might already exist or error:", e.message);
    }

    await connection.end();
    console.log("Migration complete!");
}

updateDb();
