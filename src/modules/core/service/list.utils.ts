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

/**
 * Date/number range filter, sérialisé en opérateurs dynamiques spatie.
 * `{ gte: "2026-01-01", lte: "2026-01-31" }` → `>=2026-01-01,<=2026-01-31`
 * (AllowedFilter::operator(FilterOperator::DYNAMIC), virgule = AND).
 */
export type RangeFilter = {
  gte?: string | number;
  lte?: string | number;
};

function serializeRange(range: RangeFilter): string {
  const bounds: string[] = [];
  if (range.gte !== undefined && range.gte !== "") bounds.push(`>=${range.gte}`);
  if (range.lte !== undefined && range.lte !== "") bounds.push(`<=${range.lte}`);
  return bounds.join(",");
}

function flattenFilters(
  filters?: Record<string, unknown>,
): Record<string, string | number | boolean> {
  if (!filters) return {};

  const out: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[`f[${key}]`] = value;
      continue;
    }

    // Multi-select : liste comma spatie. Tableau vide (filtre vidé) → ignoré.
    if (Array.isArray(value)) {
      if (value.length > 0) out[`f[${key}]`] = value.join(",");
      continue;
    }

    // Objet → date-range (opérateurs dynamiques spatie). Sans borne → ignoré.
    const serialized = serializeRange(value as RangeFilter);
    if (serialized) out[`f[${key}]`] = serialized;
  }

  return out;
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
