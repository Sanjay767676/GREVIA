// ---------------------------------------------------------------------------
// Rule-based classifier (AI_SPEC §3). Runs BEFORE any AI call. Returns a
// category, priority, confidence and whether the result is ambiguous enough
// to warrant an AI second opinion. Fully deterministic — no network.
// ---------------------------------------------------------------------------

import {
  CATEGORIES,
  PRIORITY,
  type Category,
  type Priority,
} from '../constants';

// Keyword maps per category. First matches from AI_SPEC, extended sensibly.
const KEYWORDS: Record<Category, string[]> = {
  NETWORK: ['wifi', 'wi-fi', 'internet', 'network', 'router', 'lan', 'ethernet', 'connectivity', 'offline', 'no signal', 'slow net'],
  ELECTRICAL: ['fan', 'light', 'switch', 'current', 'power', 'socket', 'electric', 'electricity', 'bulb', 'wiring', 'short circuit', 'ups'],
  PLUMBING: ['water', 'pipe', 'tap', 'leak', 'leakage', 'drainage', 'toilet', 'flush', 'sink', 'sewage', 'overflow'],
  CLEANING: ['dirty', 'clean', 'cleaning', 'garbage', 'dust', 'washroom', 'trash', 'unhygienic', 'smell', 'stain'],
  CLASSROOM: ['classroom', 'class room', 'projector', 'blackboard', 'whiteboard', 'bench', 'desk', 'chalk', 'ac not', 'seat'],
  LABORATORY: ['lab', 'laboratory', 'equipment', 'apparatus', 'computer lab', 'workstation', 'instrument', 'microscope'],
  HOSTEL: ['hostel', 'room', 'roommate', 'warden', 'mess room', 'dormitory', 'bed', 'cot'],
  FOOD: ['food', 'canteen', 'mess', 'meal', 'lunch', 'breakfast', 'dinner', 'quality of food', 'stale', 'menu'],
  TRANSPORT: ['bus', 'transport', 'van', 'driver', 'route', 'pickup', 'drop', 'vehicle', 'shuttle'],
  SECURITY: ['security', 'theft', 'stolen', 'guard', 'cctv', 'safety', 'unsafe', 'harassment', 'intruder'],
  ACADEMIC: ['exam', 'mark', 'marks', 'result', 'attendance', 'syllabus', 'faculty', 'lecture', 'assignment', 'grade', 'timetable'],
  ADMINISTRATIVE: ['fee', 'fees', 'certificate', 'admission', 'document', 'id card', 'office', 'form', 'refund', 'scholarship'],
  OTHER: [],
};

// Priority keyword hints (CRITICAL/HIGH). Falls back to MEDIUM.
const CRITICAL_HINTS = ['fire', 'spark', 'shock', 'flood', 'gas', 'injury', 'blood', 'danger', 'emergency', 'burning', 'smoke', 'exposed wire', 'live wire'];
const HIGH_HINTS = ['not working', 'no power', 'no water', 'no internet', 'urgent', 'immediately', 'exam', 'today', 'broken', 'stopped', 'completely'];
const LOW_HINTS = ['minor', 'sometimes', 'slightly', 'whenever possible', 'suggestion', 'request'];

export interface RuleResult {
  category: Category;
  priority: Priority;
  confidence: number; // 0..1
  ambiguous: boolean;
  matchedCategories: Category[];
}

function countMatches(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    if (text.includes(w)) n += 1;
  }
  return n;
}

export function classifyByRules(rawText: string): RuleResult {
  const text = ` ${rawText.toLowerCase()} `;

  // Score each category by keyword hits.
  const scores: { category: Category; score: number }[] = [];
  (Object.keys(KEYWORDS) as Category[]).forEach((category) => {
    if (category === CATEGORIES.OTHER) return;
    const score = countMatches(text, KEYWORDS[category]);
    if (score > 0) scores.push({ category, score });
  });

  scores.sort((a, b) => b.score - a.score);

  let category: Category = CATEGORIES.OTHER;
  let confidence = 0.3; // baseline for OTHER / no match
  let ambiguous = true;
  const matchedCategories = scores.map((s) => s.category);

  if (scores.length > 0) {
    const top = scores[0];
    const second = scores[1];
    category = top.category;

    // Confidence scales with hit count and separation from the runner-up.
    const separation = top.score - (second?.score ?? 0);
    confidence = Math.min(0.95, 0.55 + 0.12 * top.score + 0.1 * separation);

    // Ambiguous when top two categories tie or are close, or weak single hit.
    ambiguous =
      (second && top.score - second.score <= 0) ||
      (top.score === 1 && scores.length > 1);
  }

  return {
    category,
    priority: suggestPriority(text),
    confidence: Number(confidence.toFixed(3)),
    ambiguous,
    matchedCategories,
  };
}

export function suggestPriority(rawText: string): Priority {
  const text = ` ${rawText.toLowerCase()} `;
  if (countMatches(text, CRITICAL_HINTS) > 0) return PRIORITY.CRITICAL;
  if (countMatches(text, HIGH_HINTS) > 0) return PRIORITY.HIGH;
  if (countMatches(text, LOW_HINTS) > 0) return PRIORITY.LOW;
  return PRIORITY.MEDIUM;
}

// Threshold below which the caller MAY consult the AI fallback (AI_SPEC §4).
export const AI_CONFIDENCE_THRESHOLD = 0.6;

export function shouldConsultAI(result: RuleResult): boolean {
  return result.ambiguous || result.confidence < AI_CONFIDENCE_THRESHOLD;
}
