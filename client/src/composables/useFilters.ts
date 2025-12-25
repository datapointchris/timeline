import { ref, readonly } from 'vue';
import type { EventType } from 'shared/types';

export interface FilterParams {
  search?: string;
  type?: EventType;
  tag?: string;
}

const filters = ref<FilterParams>({});

export function useFilters() {
  function setFilters(params: FilterParams) {
    filters.value = { ...params };
  }

  function clearFilters() {
    filters.value = {};
  }

  return {
    filters: readonly(filters),
    setFilters,
    clearFilters,
  };
}
