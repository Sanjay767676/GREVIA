import type { AiClassificationWithModel, AiProvider } from './types.js';
import { SYSTEM_PROMPT, buildUserPrompt, parseClassification } from './prompt.js';

const TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 200;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function openAiCompatible(opts: {
  name: string;
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
}): AiProvider {
  return {
    name: opts.name,
    isConfigured: () => Boolean(opts.apiKey),
    async classify(text: string): Promise<AiClassificationWithModel> {
      if (!opts.apiKey) throw new Error(`${opts.name} not configured`);
      const res = await fetchWithTimeout(`${opts.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: opts.model,
          temperature: 0.1,
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(text) },
          ],
        }),
      });
      if (!res.ok) throw new Error(`${opts.name} HTTP ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content ?? '';
      return { ...parseClassification(content), model: opts.model };
    },
  };
}

function geminiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  return {
    name: 'gemini',
    isConfigured: () => Boolean(apiKey),
    async classify(text: string): Promise<AiClassificationWithModel> {
      if (!apiKey) throw new Error('gemini not configured');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: buildUserPrompt(text) }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const content =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      return { ...parseClassification(content), model };
    },
  };
}

export function getProvider(name: string): AiProvider | null {
  switch (name.trim().toLowerCase()) {
    case 'nvidia':
      return openAiCompatible({
        name: 'nvidia',
        apiKey: process.env.NVIDIA_API_KEY,
        baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct',
      });
    case 'grok':
      return openAiCompatible({
        name: 'grok',
        apiKey: process.env.GROK_API_KEY,
        baseUrl: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
        model: process.env.GROK_MODEL || 'grok-2-latest',
      });
    case 'openrouter':
      return openAiCompatible({
        name: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct',
      });
    case 'gemini':
      return geminiProvider();
    default:
      return null;
  }
}
