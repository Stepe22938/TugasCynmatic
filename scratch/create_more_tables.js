const mysql = require('mysql2/promise');

async function createNewTables() {
    const connection = await mysql.createConnection("mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db");
    
    console.log("Creating Polls and Tickets tables in VPS MariaDB...");
    
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS polls (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                options JSON NOT NULL,
                isActive BOOLEAN DEFAULT TRUE,
                votedUserIds JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'polls' created/verified.");
    } catch (e) { console.error("Error creating polls table:", e); }

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id VARCHAR(255) PRIMARY KEY,
                userId VARCHAR(255) NOT NULL,
                userName VARCHAR(255),
                subject VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(100),
                priority VARCHAR(20) DEFAULT 'medium',
                status VARCHAR(20) DEFAULT 'open',
                messages JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'tickets' created/verified.");
    } catch (e) { console.error("Error creating tickets table:", e); }

    await connection.end();
    console.log("Migration complete!");
}

createNewTables();
