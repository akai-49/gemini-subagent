import fs from "fs";
import path from "path";
import os from "os";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";

export interface StoredConfig {
  apiKey?: string;
  defaultModel?: string;
  autoDetectedFrom?: string;
}

export const CONFIG_DIR = path.join(os.homedir(), ".config", "gemini-subagent");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/**
 * Checks if Google Antigravity or Gemini CLI is installed on this machine
 */
export function hasAntigravityInstalled(): boolean {
  const geminiDir = path.join(os.homedir(), ".gemini");
  return fs.existsSync(geminiDir);
}

/**
 * Searches shell configs, environment variables, and Antigravity directories
 * to auto-discover an existing Gemini API key.
 */
export function autoDiscoverGeminiKey(): { key?: string; source?: string } {
  // 1. Direct process environment
  if (process.env.GEMINI_API_KEY) {
    return { key: process.env.GEMINI_API_KEY, source: "process.env.GEMINI_API_KEY" };
  }

  // 2. Saved user config file
  const stored = loadStoredConfig();
  if (stored.apiKey) {
    return { key: stored.apiKey, source: "~/.config/gemini-subagent/config.json" };
  }

  // 3. Shell profile files (~/.zshrc, ~/.bashrc, ~/.bash_profile, ~/.profile)
  const home = os.homedir();
  const shellFiles = [".zshrc", ".bash_profile", ".bashrc", ".profile", ".env"];
  for (const file of shellFiles) {
    const fullPath = path.join(home, file);
    try {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const match = content.match(/GEMINI_API_KEY\s*=\s*["']?([^"'\s\n\r]+)["']?/);
        if (match && match[1] && match[1].length > 5) {
          return { key: match[1], source: `~/${file}` };
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // 4. Standard local & project .env files
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../.env"),
    path.join(home, ".config/gemini/.env"),
    path.join(home, ".claude/.env"),
    path.join(home, "Frappe/analytics_agent/.env"),
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/GEMINI_API_KEY\s*=\s*["']?([^"'\s\n\r]+)["']?/);
        if (match && match[1] && match[1].length > 5) {
          return { key: match[1], source: envPath };
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return {};
}

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
 * Resolves the effective configuration for the server:
 * First checks saved config, then auto-detects from Antigravity/shell, then falls back to defaults.
 */
export function getEffectiveConfig(): StoredConfig {
  const config = loadStoredConfig();
  const antigravity = hasAntigravityInstalled();

  // If no API key configured yet, try auto-discovery
  if (!config.apiKey) {
    const discovered = autoDiscoverGeminiKey();
    if (discovered.key) {
      config.apiKey = discovered.key;
      config.autoDetectedFrom = discovered.source;
    }
  }

  // Default model: if Antigravity is detected or not set, default to gemini-3.8-flash
  if (!config.defaultModel) {
    config.defaultModel = process.env.GEMINI_DEFAULT_MODEL || "gemini-3.8-flash";
  }

  // If we auto-detected, persist so future MCP launches are instant
  if (config.apiKey && !fs.existsSync(CONFIG_FILE)) {
    try {
      saveStoredConfig(config);
    } catch {
      // Ignore filesystem permission errors
    }
  }

  return config;
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

  const isAntigravity = hasAntigravityInstalled();
  const discovered = autoDiscoverGeminiKey();
  const existingConfig = loadStoredConfig();

  if (isAntigravity) {
    console.log("🔍 Google Antigravity installation detected (~/.gemini)");
  }

  // 1. Prompt for API Key
  let currentKey = existingConfig.apiKey || discovered.key || process.env.GEMINI_API_KEY || "";
  let sourceInfo = discovered.source ? ` (auto-detected from ${discovered.source})` : "";

  if (currentKey) {
    const masked = `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}`;
    console.log(`Found configured key: ${masked}${sourceInfo}`);
  }

  const promptMsg = currentKey
    ? `Enter your Gemini API Key [Press Enter to keep ${currentKey.slice(0, 6)}...${currentKey.slice(-4)}]: `
    : "Enter your Google Gemini API Key (get one from https://aistudio.google.com/): ";

  const keyAnswer = await rl.question(promptMsg);
  const apiKey = keyAnswer.trim() || currentKey;

  if (!apiKey) {
    console.error("\n❌ Error: API Key cannot be empty. Please run setup again with a valid key.\n");
    rl.close();
    process.exit(1);
  }

  // 2. Prompt for Model Selection
  const currentModel = existingConfig.defaultModel || (isAntigravity ? "gemini-3.8-flash" : "gemini-3.8-flash");

  console.log("\nSelect your default Gemini model:");
  console.log("  1) gemini-3.8-flash       (Recommended: Latest flagship Flash, ultra-fast, high intelligence)");
  console.log("  2) gemini-3.7-flash       (Next-gen hybrid reasoning Flash model)");
  console.log("  3) gemini-3.6-flash       (High-efficiency Flash model)");
  console.log("  4) gemini-3.5-pro         (Deep architectural reasoning & complex coding)");
  console.log("  5) gemini-2.5-flash       (Stable standard Flash)");
  console.log("  6) gemini-2.5-pro         (Stable standard Pro)");
  console.log("  7) Custom model name");

  const modelChoice = await rl.question(`\nEnter choice [1-7] (default: 1 - ${currentModel}): `);
  let defaultModel = currentModel;

  switch (modelChoice.trim()) {
    case "1":
      defaultModel = "gemini-3.8-flash";
      break;
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
      defaultModel = currentModel;
      break;
  }

  // Save config
  saveStoredConfig({
    apiKey,
    defaultModel,
    autoDetectedFrom: discovered.source,
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
