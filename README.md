# Gemini Subagent MCP Server (`gemini-subagent-mcp`)

[![npm version](https://img.shields.io/npm/v/gemini-subagent-mcp.svg)](https://www.npmjs.com/package/gemini-subagent-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A universal [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes **Google Gemini** as an autonomous, on-demand **subagent** for:
- **Claude Code CLI**
- **Google Antigravity IDE / 2.0**
- **Claude Desktop**
- **Cursor & VS Code**

Equip your primary AI assistant (like Claude Code) with Gemini's massive 1M+ token context window, deep reasoning, and independent second-opinion code review capabilities.

---

## ⚡ 1-Minute Interactive Setup Wizard

Run this command in your terminal:

```bash
npx gemini-subagent-mcp init
```

The interactive wizard will:
1. 🔑 Prompt for your **Gemini API Key** (or keep existing)
2. 🤖 Ask you to choose your **Default Model**:
   - `gemini-3.8-flash` (Recommended: Latest flagship Flash, ultra-fast, high intelligence)
   - `gemini-3.7-flash` (Next-gen hybrid reasoning Flash model)
   - `gemini-3.6-flash` (High-efficiency Flash model)
   - `gemini-3.5-pro` (Deep architectural reasoning & complex coding)
   - `gemini-2.5-flash` / `gemini-2.5-pro`
   - Custom model name
3. 💾 Save your settings to `~/.config/gemini-subagent/config.json`
4. 🔌 Automatically register the server with **Claude Code CLI**!

---

## 🌟 Tools Provided

Once connected, your primary agent automatically gains 3 specialized subagent tools:

| Tool | Purpose | Key Parameters |
| :--- | :--- | :--- |
| `gemini_subagent` | General task delegation, alternative design exploration, and multi-file reasoning. | `task` (required), `context`, `model` (default: your chosen model), `temperature` |
| `gemini_code_review` | Independent second-opinion code review on PRs and git diffs. Detects edge cases, concurrency hazards, memory leaks, and security flaws. | `code_or_diff` (required), `focus_areas`, `model` |
| `gemini_analyze_large_context` | Digests high-volume logs, whole repository dumps, and documentation utilizing Gemini's 1M+ token context window. | `question` (required), `content` (required), `model` |

---

## 🚀 Manual Client Configurations

If you prefer to configure your clients manually:

### 1. Claude Code CLI

```bash
claude mcp add --scope user gemini-subagent -- npx -y gemini-subagent-mcp
```

Or pass your API key as an environment variable:
```bash
claude mcp add --scope user -e GEMINI_API_KEY="your_api_key_here" gemini-subagent -- npx -y gemini-subagent-mcp
```

**Verify:**
Launch `claude` and run `/mcp`. You should see `gemini-subagent` connected with status **Connected**!

---

### 2. Google Antigravity (IDE / Desktop 2.0)

Add to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "gemini-subagent": {
      "command": "npx",
      "args": ["-y", "gemini-subagent-mcp"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

---

### 3. Claude Desktop

Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gemini-subagent": {
      "command": "npx",
      "args": ["-y", "gemini-subagent-mcp"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

---

### 4. Cursor / VS Code

```json
{
  "mcpServers": {
    "gemini-subagent": {
      "command": "npx",
      "args": ["-y", "gemini-subagent-mcp"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

---

## 💡 Example Usage Prompts in Claude Code

- **Second-Opinion Code Review**:
  > *"Review our staged git changes for concurrency bugs and edge cases using the gemini_code_review tool."*

- **Massive Log / Context Investigation**:
  > *"Use the gemini_analyze_large_context tool to search this crash dump and find why the worker process terminated."*

- **Parallel Brainstorming**:
  > *"Use the gemini_subagent tool to propose an alternative architecture for our background queue."*

---

## 🛠️ Local Development

```bash
git clone https://github.com/akai-49/gemini-subagent.git
cd gemini-subagent
npm install
npm run dev
npm test
```

---

## 📄 License

MIT © [akai-49](https://github.com/akai-49)
