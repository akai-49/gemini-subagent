import fs from "fs";
import path from "path";
import os from "os";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";

export interface StoredConfig {
  apiKey?: string;
  defaultModel?: string;
}

export const CONFIG_DIR = path.join(os.homedir(), ".config", "gemini-subagent");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/**
 * Loads stored user configuration from ~/.config/gemini-subagent/config.json
 */
export function loadStoredConfig(): StoredConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore read errors
  }
  return {};
}

/**
 * Saves user configuration to ~/.config/gemini-subagent/config.json
 */
export function saveStoredConfig(config: StoredConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Interactive CLI wizard for setting up API Key and Model selection
 */
export async function runInteractiveSetup(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log("\n========================================================");
  console.log("   🤖 Gemini Subagent MCP Server Setup Wizard");
  console.log("========================================================\n");

  const existingConfig = loadStoredConfig();

  // 1. Prompt for API Key
  let currentKey = process.env.GEMINI_API_KEY || existingConfig.apiKey || "";
  let maskedKey = currentKey ? `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}` : "None";

  console.log(`Current API Key: ${maskedKey}`);
  const keyAnswer = await rl.question(
    "Enter your Google Gemini API Key (press Enter to keep current, or get one from https://aistudio.google.com/): "
  );

  const apiKey = keyAnswer.trim() || currentKey;
  if (!apiKey) {
    console.error("\n❌ Error: API Key cannot be empty. Please run setup again with a valid key.\n");
    rl.close();
    process.exit(1);
  }

  // 2. Prompt for Model Selection
  console.log("\nSelect your default Gemini model:");
  console.log("  1) gemini-3.8-flash       (Recommended: Latest flagship Flash, ultra-fast, high intelligence)");
  console.log("  2) gemini-3.7-flash       (Hybrid reasoning Flash model)");
  console.log("  3) gemini-3.6-flash       (High-efficiency Flash model)");
  console.log("  4) gemini-3.5-pro         (Deep reasoning, heavy architectural coding & large context)");
  console.log("  5) gemini-2.5-flash       (Stable standard Flash)");
  console.log("  6) gemini-2.5-pro         (Stable standard Pro)");
  console.log("  7) Custom model name");

  const modelChoice = await rl.question("\nEnter choice [1-7] (default: 1 - gemini-3.8-flash): ");
  let defaultModel = "gemini-3.8-flash";

  switch (modelChoice.trim()) {
    case "2":
      defaultModel = "gemini-3.7-flash";
      break;
    case "3":
      defaultModel = "gemini-3.6-flash";
      break;
    case "4":
      defaultModel = "gemini-3.5-pro";
      break;
    case "5":
      defaultModel = "gemini-2.5-flash";
      break;
    case "6":
      defaultModel = "gemini-2.5-pro";
      break;
    case "7": {
      const customModel = await rl.question("Enter custom model name (e.g., gemini-3.8-flash): ");
      if (customModel.trim()) defaultModel = customModel.trim();
      break;
    }
    default:
      defaultModel = "gemini-3.8-flash";
      break;
  }

  // Save config
  saveStoredConfig({
    apiKey,
    defaultModel,
  });

  console.log("\n✅ Configuration successfully saved to:");
  console.log(`   ${CONFIG_FILE}`);
  console.log(`   - Default Model: ${defaultModel}`);
  console.log(`   - API Key: ${apiKey.slice(0, 6)}...${apiKey.slice(-4)}\n`);

  // 3. Prompt to auto-register with Claude Code CLI
  const registerWithClaude = await rl.question(
    "Would you like to register this subagent with Claude Code CLI now? (Y/n): "
  );

  if (registerWithClaude.trim().toLowerCase() !== "n") {
    try {
      console.log("\nRegistering with Claude Code CLI...");
      const cmd = "claude mcp add --scope user gemini-subagent -- npx -y gemini-subagent-mcp";
      execSync(cmd, { stdio: "inherit" });
      console.log("\n🎉 Registered successfully with Claude Code!");
      console.log("   Start Claude with `claude` and run `/mcp` to verify.\n");
    } catch (err: any) {
      console.log("\n⚠️ Could not automatically run `claude mcp add`.");
      console.log("   You can add it manually by running:");
      console.log("   claude mcp add --scope user gemini-subagent -- npx -y gemini-subagent-mcp\n");
    }
  } else {
    console.log("\nYou can connect Claude Code at any time with:");
    console.log("claude mcp add --scope user gemini-subagent -- npx -y gemini-subagent-mcp\n");
  }

  rl.close();
}

