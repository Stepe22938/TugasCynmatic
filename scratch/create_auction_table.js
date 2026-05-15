const mysql = require('mysql2/promise');

async function createAuctionTable() {
    const connection = await mysql.createConnection("mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db");
    
    console.log("Creating Auctions table in VPS MariaDB...");
    
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS auctions (
                id VARCHAR(255) PRIMARY KEY,
                sellerId VARCHAR(255) NOT NULL,
                sellerName VARCHAR(255),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                imageUrl VARCHAR(500),
                startPrice DECIMAL(15, 2),
                currentPrice DECIMAL(15, 2),
                minStep DECIMAL(15, 2),
                endTime TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                bids JSON,
                winnerId VARCHAR(255),
                winnerName VARCHAR(255),
                isPaid BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'auctions' created/verified.");
    } catch (e) { console.error("Error creating auctions table:", e); }

    await connection.end();
    console.log("Migration complete!");
}

createAuctionTable();
