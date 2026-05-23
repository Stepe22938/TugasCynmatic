async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/products");
    if (!res.ok) {
      console.error(`HTTP error: ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    const products = await res.json();
    console.log("PRODUCTS IN DATABASE:");
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
