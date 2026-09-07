# Gemini Subagent MCP Server (`gemini-subagent-mcp`)

Universal [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes **Google Gemini** as an autonomous, on-demand **subagent** for:
- **Claude Code CLI**
- **Google Antigravity IDE / 2.0**
- **Claude Desktop**
- **Cursor / VS Code**

---

## 🌟 Capabilities

This server equips your primary AI assistant (e.g. Claude Code) with 3 specialized tools:

1. `gemini_subagent(task, context, model)`:
   - Delegate large context searches, alternative solution drafting, or complex reasoning.
   - Defaults to `gemini-2.5-flash` (blazing fast) with support for `gemini-2.5-pro`.
2. `gemini_code_review(code_or_diff, focus_areas)`:
   - Independent second-opinion code review on PRs and git diffs.
   - Detects edge cases, concurrency hazards, memory/security issues, and logic errors.
3. `gemini_analyze_large_context(question, content)`:
   - Digests high-volume logs, whole repository dumps, and documentation utilizing Gemini's 1M+ token context window.

---

## 🚀 Quickstart & Installation

### 1. Prerequisites
- **Node.js**: v20 or higher
- **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup
```bash
cd /Users/abhishek/gemini-subagent-mcp
npm install
npm run build
```

Copy `.env.example` to `.env` and add your API key:
```bash
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_key_here
```
*(Alternatively, export it globally in your shell: `export GEMINI_API_KEY="your-key"`)*

---

## 🔌 Connecting to AI Clients

### 1. Claude Code CLI

To make the Gemini subagent available across all projects in Claude Code:
```bash
claude mcp add --scope user gemini-subagent node /Users/abhishek/gemini-subagent-mcp/dist/index.js
```

Or for a single project:
```bash
claude mcp add --scope project gemini-subagent node /Users/abhishek/gemini-subagent-mcp/dist/index.js
```

**Verify inside Claude Code:**
Run `claude` and type `/mcp`. You will see `gemini-subagent` connected with its 3 tools!

---

### 2. Google Antigravity (IDE / Desktop 2.0)

Add to your global Antigravity MCP config (`~/.gemini/config/mcp_config.json`):

```json
{
  "mcpServers": {
    "gemini-subagent": {
      "command": "node",
      "args": ["/Users/abhishek/gemini-subagent-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

### 3. Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gemini-subagent": {
      "command": "node",
      "args": ["/Users/abhishek/gemini-subagent-mcp/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

---

## 👥 How Other Users / Developers Can Use It

### Option A: Local Repo Clone
Team members clone this repo, run `npm install && npm run build`, and add it to their Claude / Antigravity config using the instructions above.

### Option B: Publish to npm (Team-Wide `npx`)
If you publish this package to npm (publicly or to an internal private registry):
```bash
npm publish
```
Then any user on your team can connect it with zero setup:
```bash
claude mcp add --scope user gemini-subagent npx -y gemini-subagent-mcp
```

---

## 🛠️ Development & Testing

Run in development mode (with hot reloading via `tsx`):
```bash
npm run dev
```

Build for distribution:
```bash
npm run build
```
