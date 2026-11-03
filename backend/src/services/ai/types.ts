import type { Category, Priority } from '../../domain/constants.js';

export interface AiClassification {
  category: Category;
  priority: Priority;
  confidence: number;
  summary: string | null;
}

export interface AiClassificationWithModel extends AiClassification {
  model: string;
}

export interface AiProvider {
  name: string;
  isConfigured(): boolean;
  classify(text: string): Promise<AiClassificationWithModel>;
}
