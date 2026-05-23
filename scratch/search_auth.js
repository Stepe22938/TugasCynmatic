const fs = require('fs');

const filePath = 'c:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\artifacts\\ecommerce\\src\\contexts\\AuthContext.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('updateUser') || line.includes('syncUserToVPS') || line.includes('myCoinNft') || line.includes('myCoin')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
