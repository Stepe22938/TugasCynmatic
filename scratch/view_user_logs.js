const mysql = require('mysql2/promise');

const dbUrl = 'mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db';

async function main() {
  const connection = await mysql.createConnection(dbUrl);
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, email, myCoinNft, balance, activityLog, walletTransactions FROM users WHERE id LIKE "user-%"'
    );
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main();
