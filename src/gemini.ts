import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables with smart search
function initEnv() {
  if (process.env.GEMINI_API_KEY) return;

  // Search cwd, home, and standard fallback locations
  const searchPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../.env"),
    path.resolve(process.env.HOME || "", ".env"),
    path.resolve(process.env.HOME || "", ".claude/.env"),
    path.resolve(process.env.HOME || "", "Frappe/analytics_agent/.env"),
  ];

  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (process.env.GEMINI_API_KEY) break;
    }
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
      "GEMINI_API_KEY is not set. Please set it in your environment (export GEMINI_API_KEY=...) or in a .env file."
    );
  }

  const model = options.model || process.env.GEMINI_DEFAULT_MODEL || "gemini-2.5-flash";
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
