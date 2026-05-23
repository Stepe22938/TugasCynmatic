const mysql = require('mysql2/promise');

const dbUrl = 'mysql://root:phantomichostjaya@185.128.227.237:3306/cynmatic_db';

async function main() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(dbUrl);
  try {
    console.log('\n--- NFTS TABLE ---');
    const [nftsRows] = await connection.execute('SELECT * FROM nfts');
    console.log(JSON.stringify(nftsRows, null, 2));

    console.log('\n--- USERS TABLE ---');
    const [usersRows] = await connection.execute('SELECT id, name, email, myCoinNft, coins, balance FROM users');
    console.log(JSON.stringify(usersRows, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main();
