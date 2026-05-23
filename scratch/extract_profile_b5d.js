const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Extracting ProfilePage.tsx from commit b5d2187...');
  const output = execSync('git show b5d2187:artifacts/ecommerce/src/pages/ProfilePage.tsx', { 
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  
  fs.writeFileSync('scratch/b5d2187_profile.tsx', output, 'utf8');
  console.log('Successfully written to scratch/b5d2187_profile.tsx! Size:', output.length, 'bytes');
} catch (e) {
  console.error('Error:', e.message);
}
