const fs = require('fs');

const targetPath = 'c:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\artifacts\\ecommerce\\src\\pages\\ProfilePage.tsx';

try {
  const stats = fs.statSync(targetPath);
  console.log('File size:', stats.size, 'bytes');
  
  const fd = fs.openSync(targetPath, 'r');
  const buffer = Buffer.alloc(2000);
  fs.readSync(fd, buffer, 0, 2000, 0);
  fs.closeSync(fd);
  
  console.log('First 2000 characters:');
  console.log(buffer.toString('utf8'));
} catch (e) {
  console.error('Error:', e.message);
}
