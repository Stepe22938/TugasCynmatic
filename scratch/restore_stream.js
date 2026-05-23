const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetPath = 'c:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\artifacts\\ecommerce\\src\\pages\\ProfilePage.tsx';

async function main() {
  console.log('Restoring ProfilePage.tsx using stream...');
  
  const writer = fs.createWriteStream(targetPath, { encoding: 'utf8' });
  const git = spawn('git', ['show', 'e6ced4a2d9072a81e6c11e41b685d6993a9e76cd']);

  git.stdout.pipe(writer);

  git.stderr.on('data', (data) => {
    console.error('stderr:', data.toString());
  });

  git.on('close', (code) => {
    if (code === 0) {
      const stats = fs.statSync(targetPath);
      console.log(`Success! Stream finished. Recovered file size: ${stats.size} bytes`);
    } else {
      console.error(`Git process exited with code ${code}`);
    }
  });
}

main();
