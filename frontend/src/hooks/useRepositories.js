import { useQuery } from '@tanstack/react-query';

import { getRepositories } from '../services/repositories.js';

export function useRepositories(enabled = true) {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: getRepositories,
    enabled,
  });
}