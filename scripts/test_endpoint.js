// Test the /api/migrate endpoint
async function testEndpoint() {
  console.log("🔗 Testing POST /api/migrate endpoint...");
  
  try {
    const response = await fetch("http://localhost:3000/api/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        users: [{
          id: "api-test-001",
          name: "API Test User",
          email: "apitest@test.com",
          role: "user",
          isVerifiedSeller: false,
          isVerifiedReseller: false,
          coins: 0
        }],
        products: []
      })
    });

    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.ok) {
      console.log("✅ API endpoint works!");
    } else {
      console.log("❌ API endpoint returned error");
    }
  } catch (error) {
    console.error("❌ FAILED to reach API:", error.message);
  }
}

testEndpoint();
