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

const FALLBACK_MODELS: Record<string, string[]> = {
  "gemini-3.8-flash": ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-pro"],
  "gemini-3.7-flash": ["gemini-3.6-flash", "gemini-3.8-flash"],
  "gemini-3.5-pro": ["gemini-3.6-flash", "gemini-2.5-pro"],
  "gemini-2.5-flash": ["gemini-3.6-flash", "gemini-3.8-flash"],
};

async function executeSingleRequest(
  apiKey: string,
  model: string,
  options: GeminiGenerateOptions
): Promise<string> {
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

  // Set a 60-second timeout to prevent indefinite hangs
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Gemini request timed out after 60s for model ${model}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text();
    const error = new Error(`Gemini API error (HTTP ${response.status}): ${errText}`);
    (error as any).status = response.status;
    (error as any).errText = errText;
    throw error;
  }

  const data = (await response.json()) as any;
  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new Error(`No candidate returned by Gemini API for model ${model}.`);
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

/**
 * Executes a prompt against Google Gemini REST API.
 * Automatically handles 503 (high demand) and 429 (rate limits) by falling back to healthy models.
 */
export async function generateWithGemini(options: GeminiGenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured.\n" +
      "👉 Run 'npx gemini-subagent-mcp init' in your terminal to interactively set your API key and model."
    );
  }

  const primaryModel = options.model || process.env.GEMINI_DEFAULT_MODEL || "gemini-3.6-flash";
  const fallbacks = FALLBACK_MODELS[primaryModel] || ["gemini-3.6-flash"];
  const candidateModels = [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      return await executeSingleRequest(apiKey, model, options);
    } catch (err: any) {
      lastError = err;
      const status = err.status;
      const isTransient = status === 503 || status === 429 || status === 500;

      if (isTransient) {
        console.error(
          `[gemini-subagent-mcp] Model ${model} is experiencing high demand (HTTP ${status}). Attempting fallback model...`
        );
        // Small 500ms backoff before fallback
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      // Non-transient errors (e.g. 400 bad request, 401 invalid key) should fail immediately
      throw err;
    }
  }

  throw lastError;
}
