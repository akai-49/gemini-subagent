import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { getEffectiveConfig } from "./config.js";

// Load environment variables with smart search and Antigravity auto-discovery
function initEnv() {
  const effective = getEffectiveConfig();
  if (effective.apiKey && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = effective.apiKey;
  }
  if (effective.defaultModel && !process.env.GEMINI_DEFAULT_MODEL) {
    process.env.GEMINI_DEFAULT_MODEL = effective.defaultModel;
  }
}

initEnv();

export interface GeminiGenerateOptions {
  model?: string;
  systemInstruction?: string;
  prompt: string;
  temperature?: number;
}

/**
 * Executes a prompt against Google Gemini REST API.
 * Uses native fetch for zero-dependency reliability across Node 20+.
 */
export async function generateWithGemini(options: GeminiGenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured.\n" +
      "👉 Run 'npx gemini-subagent-mcp init' in your terminal to interactively set your API key and model."
    );
  }

  const model = options.model || process.env.GEMINI_DEFAULT_MODEL || "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, any> = {
    contents: [
      {
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (HTTP ${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new Error("No candidate returned by Gemini API.");
  }

  const textPart = candidate.content?.parts?.[0]?.text;
  if (!textPart) {
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      throw new Error(`Gemini stopped generation due to: ${candidate.finishReason}`);
    }
    return "(Empty response from Gemini)";
  }

  return textPart;
}
