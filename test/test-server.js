import { spawn } from "child_process";
import path from "path";

const serverPath = path.resolve("./dist/index.js");
const child = spawn("node", [serverPath], {
  stdio: ["pipe", "pipe", "inherit"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
  // Check if we received the initialize or tools/list response
  if (output.includes('"tools"')) {
    console.log("Successfully received tools from MCP server!");
    console.log(output);
    child.kill();
    process.exit(0);
  }
});

// 1. Send initialize request
const initReq = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
};

child.stdin.write(JSON.stringify(initReq) + "\n");

// 2. Send initialized notification
setTimeout(() => {
  const notif = {
    jsonrpc: "2.0",
    method: "notifications/initialized",
  };
  child.stdin.write(JSON.stringify(notif) + "\n");

  // 3. Request tools list
  const listReq = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  };
  child.stdin.write(JSON.stringify(listReq) + "\n");
}, 500);

setTimeout(() => {
  console.error("Timeout waiting for MCP response. Output was:\n", output);
  child.kill();
  process.exit(1);
}, 5000);
