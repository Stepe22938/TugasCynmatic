const fs = require("fs");
const path = require("path");

function restore() {
  const logPath = "C:\\Users\\Zaidan\\.gemini\\antigravity-ide\\brain\\3bf27d75-60f1-44d4-9cbd-520235853bb1\\.system_generated\\logs\\transcript.jsonl";
  
  if (!fs.existsSync(logPath)) {
    console.log("Log file not found at", logPath);
    return;
  }

  const lines = fs.readFileSync(logPath, "utf8").split("\n");
  console.log(`Scanning ${lines.length} log lines...`);

  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const step = JSON.parse(line);
      if (step.tool_calls) {
        for (const call of step.tool_calls) {
          if (call.name === "write_to_file" || call.name === "replace_file_content" || call.name === "multi_replace_file_content") {
            const file = call.args.TargetFile || call.args.AbsolutePath;
            if (file && file.includes("AIChatPage.tsx")) {
              console.log(`Step ${step.step_index}: ${call.name}`);
              console.log("Description:", call.args.Description || call.args.Instruction);
              console.log("Keys:", Object.keys(call.args));
              console.log("-----------------------------------------");
              count++;
            }
          }
        }
      }
    } catch (e) {
      // Ignore parse errors for truncated lines
    }
  }
  console.log(`Found ${count} edits to AIChatPage.tsx`);
}

restore();
