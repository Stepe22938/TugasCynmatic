const { execSync } = require('child_process');

const commits = ['90f3b9c', '79f9744', 'b5d2187', '006f38a', '969c663', 'a390e70', 'c1e205b'];

for (const commit of commits) {
  try {
    const output = execSync(`git show ${commit}:artifacts/ecommerce/src/pages/ProfilePage.tsx`, { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    const linesCount = output.split('\n').length;
    console.log(`Commit ${commit}: ProfilePage.tsx has ${linesCount} lines (size: ${output.length} bytes)`);
    if (linesCount > 1000) {
      console.log(`  -> Match! This commit contains the full redesigned ProfilePage.tsx!`);
    }
  } catch (e) {
    console.log(`Commit ${commit}: failed to show ProfilePage.tsx - ${e.message}`);
  }
}
