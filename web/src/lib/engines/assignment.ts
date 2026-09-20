// ---------------------------------------------------------------------------
// Assignment engine (system_design §6). DB-driven: resolves the responsible
// staff for a (category, department) from category_staff_map. Prefers a
// department-specific mapping, then falls back to the global (dept = NULL)
// mapping. Never hard-codes staff.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '../constants';

export async function resolveAssignee(
  supabase: SupabaseClient,
  category: Category,
  departmentId: string | null,
): Promise<string | null> {
  // Department-specific mapping first.
  if (departmentId) {
    const { data: deptMap } = await supabase
      .from('category_staff_map')
      .select('staff_id')
      .eq('category', category)
      .eq('department_id', departmentId)
      .maybeSingle();
    if (deptMap?.staff_id) return deptMap.staff_id;
  }

  // Global fallback (department_id IS NULL).
  const { data: globalMap } = await supabase
    .from('category_staff_map')
    .select('staff_id')
    .eq('category', category)
    .is('department_id', null)
    .maybeSingle();

  return globalMap?.staff_id ?? null;
}
