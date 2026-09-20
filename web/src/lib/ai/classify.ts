// ---------------------------------------------------------------------------
// Classification orchestrator (AI_SPEC §3-4, §8). Rule-first: run the
// deterministic classifier; only consult AI when the rule result is
// ambiguous/low-confidence AND at least one provider is configured. AI failure
// NEVER blocks — always degrade to the rule result (RULE_ENGINE).
// ---------------------------------------------------------------------------

import { CLASSIFICATION_SOURCE } from '../constants';
import type { ClassificationResult } from '../types';
import {
  classifyByRules,
  shouldConsultAI,
} from '../engines/classifier';
import { getProvider } from './providers';

export async function classifyComplaint(
  text: string,
): Promise<ClassificationResult> {
  const rule = classifyByRules(text);

  const ruleResult: ClassificationResult = {
    category: rule.category,
    priority: rule.priority,
    confidence: rule.confidence,
    summary: null,
    source: CLASSIFICATION_SOURCE.RULE_ENGINE,
  };

  // Strong deterministic match — do not call AI (AI_SPEC §3).
  if (!shouldConsultAI(rule)) {
    return ruleResult;
  }

  const order = (process.env.AI_PROVIDER_ORDER || 'nvidia,gemini,grok,openrouter')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const name of order) {
    const provider = getProvider(name);
    if (!provider || !provider.isConfigured()) continue;
    try {
      const ai = await provider.classify(text);
      return {
        category: ai.category,
        priority: ai.priority,
        confidence: ai.confidence,
        summary: ai.summary,
        source: CLASSIFICATION_SOURCE.AI,
        model: `${provider.name}:${ai.model}`,
      };
    } catch (err) {
      // Log and try the next provider. Never throw to the caller.
      console.warn(`[ai] provider ${name} failed:`, (err as Error).message);
      continue;
    }
  }

  // No provider configured or all failed — deterministic fallback.
  return ruleResult;
}
