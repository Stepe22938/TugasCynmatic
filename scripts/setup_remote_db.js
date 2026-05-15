import mysql from 'mysql2/promise';

async function setup() {
  console.log("Connecting to VPS MariaDB at 185.128.227.237...");
  
  try {
    const connection = await mysql.createConnection({
      host: '185.128.227.237',
      user: 'root',
      password: 'phantomichostjaya',
      connectTimeout: 10000 // 10 seconds
    });

    console.log("Connected successfully!");

    console.log("Creating database 'cynmatic_db'...");
    await connection.query("CREATE DATABASE IF NOT EXISTS cynmatic_db");
    await connection.query("USE cynmatic_db");

    console.log("Creating tables...");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        role ENUM('user', 'seller', 'admin', 'kurir'),
        isVerifiedSeller BOOLEAN DEFAULT FALSE,
        isVerifiedReseller BOOLEAN DEFAULT FALSE,
        coins BIGINT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        price DECIMAL(15, 2),
        stock INT,
        category VARCHAR(100),
        sellerId VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected'),
        isFlashSale BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Setting up remote permissions for root...");
    // Ensure root@% exists and has the correct password
    try {
      await connection.query("CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'phantomichostjaya'");
    } catch (e) {
      // User might already exist
    }
    await connection.query("GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION");
    await connection.query("FLUSH PRIVILEGES");

    console.log("VPS MariaDB Setup Complete!");
    await connection.end();
  } catch (error) {
    console.error("FAILED to connect to VPS MariaDB:");
    console.error(error.message);
    console.log("\nPossible reasons:");
    console.log("1. Firewall on VPS is blocking port 3306.");
    console.log("2. MariaDB is not listening on 0.0.0.0 (check /etc/mysql/mariadb.conf.d/50-server.cnf).");
    console.log("3. User permissions on VPS don't allow remote root login.");
  }
}

setup();
