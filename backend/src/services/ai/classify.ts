import { CLASSIFICATION_SOURCE } from '../../domain/constants.js';
import type { ClassificationResult } from '../../domain/types.js';
import { classifyByRules, shouldConsultAI } from '../classifier.js';
import { getProvider } from './providers.js';

// Rule-first classification. AI is consulted only when the rule engine is
// uncertain, and any AI failure degrades to the rule result.
export async function classifyComplaint(text: string): Promise<ClassificationResult> {
  const rule = classifyByRules(text);

  const ruleResult: ClassificationResult = {
    category: rule.category,
    priority: rule.priority,
    confidence: rule.confidence,
    summary: null,
    source: CLASSIFICATION_SOURCE.RULE_ENGINE,
  };

  if (!shouldConsultAI(rule)) return ruleResult;

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
      console.warn(`[ai] provider ${name} failed:`, (err as Error).message);
    }
  }

  return ruleResult;
}
