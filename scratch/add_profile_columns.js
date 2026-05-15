const mysql = require('mysql2/promise');

async function updateDb() {
    const connection = await mysql.createConnection("mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db");
    
    console.log("Adding profile customization columns to VPS MariaDB...");
    
    try {
        await connection.query("ALTER TABLE users ADD COLUMN bio TEXT AFTER myCryptoExpiry");
        console.log("Added 'bio' column.");
    } catch (e) { console.log("bio column might already exist."); }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN theme VARCHAR(255) DEFAULT 'from-primary to-orange-600' AFTER bio");
        console.log("Added 'theme' column.");
    } catch (e) { console.log("theme column might already exist."); }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN youtubeId VARCHAR(50) AFTER theme");
        console.log("Added 'youtubeId' column.");
    } catch (e) { console.log("youtubeId column might already exist."); }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN useAnimation BOOLEAN DEFAULT FALSE AFTER youtubeId");
        console.log("Added 'useAnimation' column.");
    } catch (e) { console.log("useAnimation column might already exist."); }

    await connection.end();
    console.log("Migration complete!");
}

updateDb();
