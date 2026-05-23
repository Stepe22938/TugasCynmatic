async function main() {
  try {
    const userId = 'admin-001';
    const nftId = 5; // Price: 50 MCNFT, admin-001 balance: 225 MCNFT

    console.log(`Sending POST request to buy NFT ${nftId} for user ${userId}...`);
    const res = await fetch(`http://localhost:3000/api/nfts/${nftId}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    console.log('HTTP Status Code:', res.status);
    console.log('API Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

main();
