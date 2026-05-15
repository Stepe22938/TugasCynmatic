const mysql = require('mysql2/promise');

async function createTables() {
    const connection = await mysql.createConnection("mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db");
    
    console.log("Creating Orders and Reviews tables in VPS MariaDB...");
    
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(255) PRIMARY KEY,
                userId VARCHAR(255) NOT NULL,
                userName VARCHAR(255),
                orderNumber VARCHAR(100) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                items JSON NOT NULL,
                subtotal DECIMAL(15, 2),
                shippingFee DECIMAL(15, 2),
                grandTotal DECIMAL(15, 2),
                status VARCHAR(50) DEFAULT 'placed',
                shippingInfo JSON,
                paymentMethod VARCHAR(50),
                voucherCode VARCHAR(100),
                voucherDiscount INT,
                coinDiscount INT,
                messages JSON,
                problemReport TEXT,
                courierNote TEXT,
                reviews JSON
            )
        `);
        console.log("Table 'orders' created/verified.");
    } catch (e) { console.error("Error creating orders table:", e); }

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                productId INT NOT NULL,
                orderId VARCHAR(255) NOT NULL,
                userName VARCHAR(255),
                rating INT NOT NULL,
                status VARCHAR(50),
                comment TEXT,
                mediaFiles JSON,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'reviews' created/verified.");
    } catch (e) { console.error("Error creating reviews table:", e); }

    await connection.end();
    console.log("Migration complete!");
}

createTables();
