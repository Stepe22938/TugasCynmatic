// Test upload endpoint dengan FormData multipart
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Buat dummy image bytes (1x1 pixel PNG)
const PNG_1PX = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489" +
  "0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082",
  "hex"
);

const boundary = `----FormBoundary${crypto.randomBytes(8).toString("hex")}`;
const CRLF = "\r\n";

const body = Buffer.concat([
  Buffer.from(`--${boundary}${CRLF}`),
  Buffer.from(`Content-Disposition: form-data; name="media"; filename="test.png"${CRLF}`),
  Buffer.from(`Content-Type: image/png${CRLF}${CRLF}`),
  PNG_1PX,
  Buffer.from(`${CRLF}--${boundary}--${CRLF}`),
]);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/messages/upload",
  method: "POST",
  headers: {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  },
};

console.log("[TEST] Uploading test PNG to /api/messages/upload ...");
const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("[TEST] Status:", res.statusCode);
    try {
      const parsed = JSON.parse(data);
      if (parsed.success && parsed.mediaUrl) {
        console.log("[TEST] ✅ Upload sukses!");
        console.log("       mediaUrl:", parsed.mediaUrl);
        console.log("       mediaType:", parsed.mediaType);
        console.log("       size:", parsed.size, "bytes");
      } else {
        console.log("[TEST] ❌ Upload gagal:", parsed);
      }
    } catch (e) {
      console.log("[TEST] Raw response:", data.slice(0, 500));
    }
  });
});

req.on("error", (e) => console.log("[TEST] Error:", e.message));
req.write(body);
req.end();
