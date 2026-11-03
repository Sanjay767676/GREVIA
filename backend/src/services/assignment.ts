import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '../domain/constants.js';

// Resolve the responsible staff for (category, department). Prefers a
// department-specific mapping, then the global (department = NULL) mapping.
export async function resolveAssignee(
  supabase: SupabaseClient,
  category: Category,
  departmentId: string | null,
): Promise<string | null> {
  if (departmentId) {
    const { data: deptMap } = await supabase
      .from('category_staff_map')
      .select('staff_id')
      .eq('category', category)
      .eq('department_id', departmentId)
      .maybeSingle();
    if (deptMap?.staff_id) return deptMap.staff_id;
  }

  const { data: globalMap } = await supabase
    .from('category_staff_map')
    .select('staff_id')
    .eq('category', category)
    .is('department_id', null)
    .maybeSingle();

  return globalMap?.staff_id ?? null;
}
