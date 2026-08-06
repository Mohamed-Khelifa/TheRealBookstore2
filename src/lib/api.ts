import { supabase } from './supabase';

export async function fetchAllRows(tableName: string, columns = '*', orderBy: string | null = 'created_at', ascending = false) {
  let allRows: any[] = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    let query = supabase
      .from(tableName)
      .select(columns);
      
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    
    query = query.range(from, from + step - 1);
    const { data, error } = await query;
      
    if (error) {
      // If ordering failed (e.g. column created_at missing), attempt fallback without ordering
      if (orderBy) {
        try {
          const fallbackRes = await supabase
            .from(tableName)
            .select(columns)
            .range(from, from + step - 1);

          if (!fallbackRes.error && fallbackRes.data) {
            allRows = [...allRows, ...fallbackRes.data];
            if (fallbackRes.data.length < step) {
              break;
            }
            from += step;
            continue;
          }
        } catch (e) {
          // Ignore fallback error
        }
      }

      if (allRows.length === 0) {
        console.warn(`Fetch warning for ${tableName}:`, error.message || error);
      }
      return { data: allRows.length > 0 ? allRows : [], error: allRows.length > 0 ? null : error };
    }
    
    if (data) {
      allRows = [...allRows, ...data];
    }
    
    if (!data || data.length < step) {
      break;
    }
    
    from += step;
  }
  
  return { data: allRows, error: null };
}
