

async function testEndpoint() {
  const url = 'http://localhost:3000/api/ai/check-product';
  const payload = {
    name: 'Sepatu Sneakers Premium',
    description: 'Sepatu kets nyaman untuk jalan-jalan sore hari, kualitas terjamin.',
    price: 299000,
    category: 'Sepatu',
    productId: 1
  };

  console.log('Sending request to', url, '...');
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const duration = (Date.now() - start) / 1000;
    console.log(`Response status: ${res.status} (took ${duration}s)`);
    const data = await res.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testEndpoint();
