const mysql = require('mysql2/promise');

async function createFinalTables() {
    const connection = await mysql.createConnection("mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db");
    
    console.log("Creating Vouchers and Redeem Codes tables in VPS MariaDB...");
    
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS vouchers (
                id VARCHAR(255) PRIMARY KEY,
                code VARCHAR(100) NOT NULL UNIQUE,
                type VARCHAR(20) NOT NULL,
                value DECIMAL(15, 2) NOT NULL,
                minPurchase DECIMAL(15, 2) DEFAULT 0,
                maxDiscount DECIMAL(15, 2),
                expiresAt TIMESTAMP NULL,
                maxUses INT DEFAULT 0,
                usedCount INT DEFAULT 0,
                isActive BOOLEAN DEFAULT TRUE,
                description TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'vouchers' created/verified.");
    } catch (e) { console.error("Error creating vouchers table:", e); }

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS redeem_codes (
                id VARCHAR(255) PRIMARY KEY,
                code VARCHAR(100) NOT NULL UNIQUE,
                type VARCHAR(20) NOT NULL,
                value DECIMAL(15, 2) NOT NULL,
                maxUses INT DEFAULT 0,
                usedBy JSON,
                isActive BOOLEAN DEFAULT TRUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'redeem_codes' created/verified.");
    } catch (e) { console.error("Error creating redeem_codes table:", e); }

    await connection.end();
    console.log("Migration complete!");
}

createFinalTables();
