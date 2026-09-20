import type { Category, Priority } from '../constants';

// Strict JSON contract the model must return (AI_SPEC §5).
export interface AiClassification {
  category: Category;
  priority: Priority;
  confidence: number; // 0..1
  summary: string | null;
}

export interface AiProvider {
  name: string;
  // Returns null if not configured (no API key).
  isConfigured(): boolean;
  classify(text: string): Promise<AiClassificationWithModel>;
}

export interface AiClassificationWithModel extends AiClassification {
  model: string;
}
