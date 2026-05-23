async function main() {
  try {
    console.log('Fetching from backend /api/nfts...');
    const res = await fetch('http://localhost:3000/api/nfts');
    const data = await res.json();
    console.log('Response status:', res.status);
    console.log('NFTs from API:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

main();
