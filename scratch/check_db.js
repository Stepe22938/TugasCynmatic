const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = 'c:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] && parts[0].trim() === 'DATABASE_URL') {
    dbUrl = parts.slice(1).join('=').trim();
  }
});

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env!');
  process.exit(1);
}

async function check() {
  const connectionString = dbUrl.replace(/^mysql:\/\//, 'mysql2://');
  const pool = mysql.createPool({
    uri: connectionString,
  });
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT * FROM android_packages ORDER BY id DESC');
    console.log('Android Packages Table Contents:');
    console.log(JSON.stringify(rows, null, 2));

    const [userRows] = await conn.execute("SELECT id, name, role, activityLog FROM users WHERE role = 'admin' LIMIT 5");
    console.log('Admin Users:');
    userRows.forEach(u => {
      let logs = [];
      try {
        logs = typeof u.activityLog === 'string' ? JSON.parse(u.activityLog) : u.activityLog;
      } catch (e) {}
      console.log(`- ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Logs Count: ${logs ? logs.length : 0}`);
      if (logs && logs.length > 0) {
        console.log('  Recent Logs:', logs.slice(-3));
      }
    });
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

check();
