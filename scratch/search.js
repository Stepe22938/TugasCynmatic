const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\artifacts\\ecommerce\\src\\pages\\AdminPage.tsx';
const content = fs.readFileSync(filePath, 'utf16le'); // Try UTF-16 first, or UTF-8

// Let's print the length of file and test both encodings
console.log('UTF-16LE length:', content.length);
const contentUtf8 = fs.readFileSync(filePath, 'utf8');
console.log('UTF-8 length:', contentUtf8.length);

const activeEncoding = contentUtf8.includes('type Tab =') ? 'utf8' : 'utf16le';
console.log('Detected encoding:', activeEncoding);

const fileContent = activeEncoding === 'utf8' ? contentUtf8 : content;

// Find all matches for "activeTab ===" or "activeTab ===" or "activeTab"
const lines = fileContent.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('activeTab') || line.includes('products') || line.includes('android') || line.includes('Tab =')) {
    if (idx < 50 || (idx > 100 && idx < 300) || line.includes('activeTab') || line.includes('android')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
