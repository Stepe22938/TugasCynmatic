// Test apakah route /api/messages sudah ada dan upload berfungsi
const http = require("http");
const fs = require("fs");
const path = require("path");

// Test 1: GET /api/messages/test/test2
const options1 = {
  hostname: "localhost",
  port: 3000,
  path: "/api/messages/user-001/user-002",
  method: "GET",
};

console.log("[TEST] Calling GET /api/messages/user-001/user-002 ...");
const req = http.request(options1, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("[TEST] Status:", res.statusCode);
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 404 && parsed.error) {
        console.log("[TEST] ❌ Route tidak ditemukan — API server masih pakai build lama");
        console.log("       Error:", parsed.error);
      } else if (Array.isArray(parsed)) {
        console.log("[TEST] ✅ Route ada! Returned", parsed.length, "messages");
      } else {
        console.log("[TEST] Response:", data.slice(0, 200));
      }
    } catch (e) {
      console.log("[TEST] Raw response:", data.slice(0, 200));
    }
  });
});
req.on("error", (e) => console.log("[TEST] Connection error:", e.message));
req.end();
