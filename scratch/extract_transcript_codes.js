const fs = require('fs');

const logPath = 'C:\\Users\\Zaidan\\.gemini\\antigravity-ide\\brain\\517c6e8b-f047-4e14-ba2d-db47137f4627\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  console.log('Scanning transcript.jsonl for code segments...');
  if (!fs.existsSync(logPath)) {
    console.error('Log file does not exist at:', logPath);
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    try {
      const obj = JSON.parse(line);
      // Check if it's a model response or tool output that might have had code written or read
      if (obj.content && obj.content.includes('ProfilePage.tsx') && obj.content.length > 3000) {
        console.log(`Line ${i}: type=${obj.type}, length=${obj.content.length}`);
        fs.writeFileSync(`scratch/segment_${i}.txt`, obj.content, 'utf8');
        console.log(`  -> Written to scratch/segment_${i}.txt`);
      }
    } catch (e) {
      // ignore
    }
  }
}

main();
