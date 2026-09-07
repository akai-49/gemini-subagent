#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateWithGemini } from "./gemini.js";

const server = new McpServer({
  name: "gemini-subagent-mcp",
  version: "1.0.0",
});

// Tool 1: General Subagent Delegation
server.tool(
  "gemini_subagent",
  `Delegate tasks, reasoning, exploratory codebase research, or drafting solutions to the Google Gemini subagent.
Supports massive context (up to 1M+ tokens on Gemini 2.5 Flash / Pro).

Parameters:
- task (required): Clear instructions for what you want the Gemini subagent to do.
- context (optional): Any code snippets, requirements, or documentation to feed as background.
- model (optional): 'gemini-2.5-flash' (default, very fast) or 'gemini-2.5-pro' (deep reasoning).
- temperature (optional): 0.0 to 1.0 (default: 0.2).`,
  {
    task: z.string().min(1, "Task description is required").describe("The prompt or task for the subagent to execute"),
    context: z.string().optional().describe("Optional context, code snippets, or error logs"),
    model: z.string().default("gemini-2.5-flash").describe("Gemini model to use ('gemini-2.5-flash' or 'gemini-2.5-pro')"),
    temperature: z.number().min(0).max(1).default(0.2).describe("Sampling temperature"),
  },
  async ({ task, context, model, temperature }) => {
    try {
      let prompt = `### TASK FROM PRIMARY AGENT:\n${task}\n`;
      if (context) {
        prompt += `\n### ATTACHED CONTEXT / DATA:\n${context}\n`;
      }

      const response = await generateWithGemini({
        model,
        temperature,
        systemInstruction:
          "You are an expert AI software engineer subagent assisting a primary AI agent (like Claude Code or Antigravity). " +
          "Your job is to provide rigorous, accurate, structured, and actionable technical findings.",
        prompt,
      });

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `[Gemini Subagent Error]: ${err.message || String(err)}` }],
      };
    }
  }
);

// Tool 2: Specialized Code Review & Edge-Case Audit
server.tool(
  "gemini_code_review",
  `Perform an independent, second-opinion code review on a diff, file, or implementation plan.
Checks for:
- Logical edge cases and off-by-one errors
- Concurrency, race conditions, or unhandled promise rejections
- Security flaws, authorization checks, and data leaks
- Performance regressions and redundant operations

Parameters:
- code_or_diff (required): The git diff or source code to review.
- focus_areas (optional): Specific concerns (e.g. 'check multi-tenant isolation', 'verify error handling').
- model (optional): Gemini model tier (default: 'gemini-2.5-flash').`,
  {
    code_or_diff: z.string().min(1, "code_or_diff is required").describe("The git diff or code to review"),
    focus_areas: z.string().optional().describe("Specific review focus areas or architectural constraints"),
    model: z.string().default("gemini-2.5-flash").describe("Model to use"),
  },
  async ({ code_or_diff, focus_areas, model }) => {
    try {
      let prompt = "Please review the following code / git diff thoroughly:\n\n```\n" + code_or_diff + "\n```\n";
      if (focus_areas) {
        prompt += `\n### SPECIAL FOCUS AREAS:\n${focus_areas}\n`;
      }

      const response = await generateWithGemini({
        model,
        temperature: 0.1,
        systemInstruction:
          "You are a Principal Code Reviewer and Security Auditor. " +
          "Audit the code strictly. Highlight critical bugs, edge cases, and performance hazards. " +
          "Cite exact lines/snippets and recommend concrete fixes.",
        prompt,
      });

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `[Gemini Code Review Error]: ${err.message || String(err)}` }],
      };
    }
  }
);

// Tool 3: Large Context Digest & Search
server.tool(
  "gemini_analyze_large_context",
  `Digest and search through massive volumes of text, logs, or multi-file codebases utilizing Gemini's 1M+ token window.

Parameters:
- question (required): The analytical question, bug symptom, or pattern you are searching for.
- content (required): The large corpus (e.g. log dump, concatenated files, or API spec).
- model (optional): Gemini model tier (default: 'gemini-2.5-flash').`,
  {
    question: z.string().min(1, "Question is required").describe("The question or search query"),
    content: z.string().min(1, "Content is required").describe("The high-volume text, logs, or codebase dump"),
    model: z.string().default("gemini-2.5-flash").describe("Model to use"),
  },
  async ({ question, content, model }) => {
    try {
      const prompt =
        `### OBJECTIVE / QUESTION:\n${question}\n\n` +
        `### LARGE CONTEXT / LOGS / FILES:\n${content}\n`;

      const response = await generateWithGemini({
        model,
        temperature: 0.1,
        systemInstruction:
          "You are an expert log analyzer and codebase synthesis agent with a massive context window. " +
          "Extract the precise answers, trace root causes, and provide concise citations from the provided context.",
        prompt,
      });

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `[Gemini Context Analysis Error]: ${err.message || String(err)}` }],
      };
    }
  }
);

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so stdout remains clean for MCP JSON-RPC protocol
  console.error("Gemini Subagent MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting Gemini Subagent MCP server:", err);
  process.exit(1);
});

