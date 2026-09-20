import { CATEGORIES, PRIORITY } from '../constants';
import type { AiClassification } from './types';

const CATEGORY_LIST = Object.values(CATEGORIES).join(', ');
const PRIORITY_LIST = Object.values(PRIORITY).join(', ');

// Short prompt — token-optimized per AI_SPEC §6. Sends only complaint text.
export const SYSTEM_PROMPT =
  'You are a campus grievance classifier. Reply with STRICT JSON only, no markdown, no prose.';

export function buildUserPrompt(text: string): string {
  return [
    'Classify the complaint below.',
    `Return JSON: {"category": one of [${CATEGORY_LIST}], "priority": one of [${PRIORITY_LIST}], "confidence": 0..1, "summary": short string}.`,
    'Complaint:',
    text.slice(0, 1500),
  ].join('\n');
}

// Parse + validate a model response into a strict AiClassification.
// Throws if the payload can't be coerced to the contract.
export function parseClassification(raw: string): AiClassification {
  const jsonText = extractJson(raw);
  const obj = JSON.parse(jsonText) as Record<string, unknown>;

  const category = String(obj.category ?? '').toUpperCase();
  const priority = String(obj.priority ?? '').toUpperCase();
  const validCategory = (Object.values(CATEGORIES) as string[]).includes(category);
  const validPriority = (Object.values(PRIORITY) as string[]).includes(priority);

  if (!validCategory || !validPriority) {
    throw new Error('AI returned invalid category/priority');
  }

  let confidence = Number(obj.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.7;
  confidence = Math.max(0, Math.min(1, confidence));

  const summary =
    typeof obj.summary === 'string' && obj.summary.trim()
      ? obj.summary.trim().slice(0, 300)
      : null;

  return {
    category: category as AiClassification['category'],
    priority: priority as AiClassification['priority'],
    confidence,
    summary,
  };
}

// Models sometimes wrap JSON in ```json fences or add stray text. Extract the
// first {...} block.
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in AI response');
  }
  return candidate.slice(start, end + 1);
}
