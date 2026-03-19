import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppData } from '@/types';
import { loadAppData, normalizeData, saveAppData } from '@/lib/storage';

const QUERY_KEY = ['scholarflow-data'];

export function useScholarData() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => loadAppData(),
  });

  function commit(updater: (draft: AppData) => AppData | void) {
    const current = structuredClone(
      (queryClient.getQueryData(QUERY_KEY) as AppData | undefined) ?? loadAppData(),
    );
    const updated = updater(current) ?? current;
    const normalized = normalizeData(updated);

    saveAppData(normalized);
    queryClient.setQueryData(QUERY_KEY, normalized);

    return normalized;
  }

  return {
    data: query.data ?? loadAppData(),
    isLoading: query.isLoading,
    commit,
  };
}
