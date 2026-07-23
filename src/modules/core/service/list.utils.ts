import { type TableQueries } from "@/modules/core/service/api.types";

export function toQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function adaptFilters(params: TableQueries): string {
  const elements: Record<string, string | number | boolean | undefined> = {
    ...flattenFilters(params.filters),
    s: params.sort
      ? adaptSort(Array.isArray(params.sort) ? params.sort : [params.sort])
      : "-updated_at",
    query: params.query || undefined,
    page: params.page ?? 1,
    per_page: params.per_page ?? 10,
  };

  if (!elements.query) delete elements.query;

  return toQueryString(elements);
}

function flattenFilters(
  filters?: Record<string, unknown>,
): Record<string, string | number | boolean> {
  if (!filters) return {};

  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          return [`f[${key}]`, value] as const;
        }

        return [`f[${key}]`, String(value)] as const;
      }),
  );
}

/**
 * Create the sort part of the query string
 *
 * @param sorts string[]
 * @example -updated_at
 * @example id
 * @returns string
 */
export function adaptSort(sorts: string[]): string {
  return sorts.join(",");
}
