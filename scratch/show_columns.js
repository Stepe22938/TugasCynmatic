const mysql = require("mysql2/promise");

async function run() {
  const url = "mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db";
  try {
    const conn = await mysql.createConnection(url);
    console.log("Connected!");
    const [columns] = await conn.query("SHOW COLUMNS FROM products");
    console.log("COLUMNS:");
    console.log(columns);
    const [rows] = await conn.query("SELECT * FROM products");
    console.log("ROWS:");
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error(err);
  }
}
run();
