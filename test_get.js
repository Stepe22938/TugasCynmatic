async function test() {
  const url = "http://localhost:3000/api/ai/analysis-history";
  console.log("Sending GET to:", url);
  try {
    const response = await fetch(url);
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
test();
