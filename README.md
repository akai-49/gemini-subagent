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

## 🌟 Tools Provided

Once connected, your primary agent automatically gains 3 specialized subagent tools:

| Tool | Purpose | Key Parameters |
| :--- | :--- | :--- |
| `gemini_subagent` | General task delegation, alternative design exploration, and multi-file reasoning. | `task` (required), `context`, `model` (default: `gemini-2.5-flash`), `temperature` |
| `gemini_code_review` | Independent second-opinion code review on PRs and git diffs. Detects edge cases, concurrency hazards, memory leaks, and security flaws. | `code_or_diff` (required), `focus_areas`, `model` |
| `gemini_analyze_large_context` | Digests high-volume logs, whole repository dumps, and documentation utilizing Gemini's 1M+ token context window. | `question` (required), `content` (required), `model` |

---

## 🔑 Prerequisites & Configuration

You need a **Google Gemini API Key** (free tier available at [Google AI Studio](https://aistudio.google.com/)).

You can provide the key via:
- **Environment Variable** (recommended): `export GEMINI_API_KEY="your_api_key_here"`
- **Client Configuration**: Passed directly in your MCP client `env` settings (shown below).
- **`.env` File**: Placed in your home directory (`~/.env`), working directory, or `~/.config/gemini/.env`.

---

## 🚀 Quick Setup by Client

### 1. Claude Code CLI

Run this single command in your terminal to enable the Gemini subagent globally across all projects:

```bash
claude mcp add --scope user gemini-subagent npx -y gemini-subagent-mcp
```

Or pass your API key directly:
```bash
claude mcp add --scope user -e GEMINI_API_KEY="your-key" gemini-subagent npx -y gemini-subagent-mcp
```

**Verify inside Claude Code:**
Launch `claude` and run `/mcp`. You should see `gemini-subagent` connected with status **Connected** and its 3 tools available!

---

### 2. Google Antigravity (IDE / Desktop 2.0)

Add the following to your global Antigravity MCP config (`~/.gemini/config/mcp_config.json`):

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

Add to your `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

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

### 4. Cursor / VS Code (Cline / Roo-Code / Copilot)

Add to your MCP settings file:

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

Once configured, Claude Code can autonomously call Gemini whenever you ask:

- **Second-Opinion Review**:
  > *"Review our staged git changes for concurrency bugs and performance regressions using the gemini_code_review tool."*

- **Large Context / Log Investigation**:
  > *"Use the gemini_analyze_large_context tool to search this 50MB crash log and find why the worker process terminated."*

- **Parallel Brainstorming**:
  > *"Use the gemini_subagent tool to propose an alternative architecture for our caching layer and compare it to our current plan."*

---

## 🛠️ Local Development & Contributing

If you wish to clone and modify the server:

```bash
git clone https://github.com/akai-49/gemini-subagent.git
cd gemini-subagent
npm install
npm run build
```

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

---

## 📄 License

MIT © [akai-49](https://github.com/akai-49)
