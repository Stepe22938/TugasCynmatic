const { execSync } = require('child_process');
const fs = require('fs');

const targetPath = 'c:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\artifacts\\ecommerce\\src\\pages\\ProfilePage.tsx';

try {
  console.log('Fetching blob content with large buffer...');
  const output = execSync('git show e6ced4a2d9072a81e6c11e41b685d6993a9e76cd', { 
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024 // 50MB buffer
  });
  console.log('Blob size:', output.length, 'characters');
  
  if (output.includes('ProfilePage.tsx') || output.includes('activeNftTab') || output.includes('mcnftBalance')) {
    console.log('Success! The blob contains the redesigned ProfilePage.tsx!');
    fs.writeFileSync(targetPath, output, 'utf8');
    console.log('ProfilePage.tsx has been successfully restored to 1433 lines!');
  } else {
    console.log('Blob does not seem to be ProfilePage.tsx. First 200 characters:');
    console.log(output.substring(0, 200));
  }
} catch (e) {
  console.error('Error showing blob:', e.message);
}
