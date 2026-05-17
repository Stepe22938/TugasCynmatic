const http = require('http');

http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log(`API returned ${products.length} products:`);
      products.forEach(p => console.log(`- ${p.name} (ID: ${p.id}, Seller: ${p.sellerId}, Status: ${p.status})`));
    } catch (e) {
      console.error('Failed to parse API response:', data);
    }
  });
}).on('error', (err) => {
  console.error('API Error:', err.message);
});
