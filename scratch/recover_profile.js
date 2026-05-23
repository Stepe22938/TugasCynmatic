const fs = require('fs');

const logPath = 'C:\\Users\\Zaidan\\.gemini\\antigravity-ide\\brain\\517c6e8b-f047-4e14-ba2d-db47137f4627\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  console.log('Searching for ProfilePage.tsx in transcript...');
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist at:', logPath);
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  let matchCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    if (line.includes('ProfilePage.tsx')) {
      matchCount++;
      try {
        const obj = JSON.parse(line);
        console.log(`Line ${i}: source=${obj.source}, type=${obj.type}, status=${obj.status}, keys=${Object.keys(obj)}`);
        // If there's content, show start snippet
        if (obj.content) {
          console.log('  Content length:', obj.content.length);
          console.log('  Snippet:', obj.content.substring(0, 200).replace(/\n/g, ' '));
        }
        // Let's search inside the whole object recursively
        searchKeys(obj, 'ProfilePage.tsx');
      } catch (e) {
        console.log(`Line ${i}: matches text but failed JSON parse.`);
      }
      if (matchCount >= 10) {
        console.log('Truncating search logs at 10 matches.');
        break;
      }
    }
  }
}

function searchKeys(obj, targetStr, pathStr = 'obj') {
  if (!obj || typeof obj !== 'object') return;
  
  for (const k in obj) {
    const val = obj[k];
    if (typeof val === 'string' && val.includes(targetStr)) {
      console.log(`  -> Match at ${pathStr}.${k} (length: ${val.length})`);
      if (val.length > 5000) {
        console.log(`    First 300 chars: ${val.substring(0, 300).replace(/\n/g, ' ')}`);
      }
    } else if (typeof val === 'object' && val !== null) {
      searchKeys(val, targetStr, `${pathStr}.${k}`);
    }
  }
}

main();
