import { type PaginatedResponse, type TableQueries } from "@/modules/core"
import type { KyResponse } from "ky"
import { FlexService } from "./flex.service"
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"

// Dé-wrappe le KyResponse en PaginatedResponse pour la DataTable (data + meta).
// keepPreviousData : anti-flash au changement de filtre/tri/page.
export const useFlexList = (
  resource: string,
  query: TableQueries,
): UseQueryResult<PaginatedResponse<unknown>, Error> => {
  const service = new FlexService(resource);
  return useQuery({
    queryKey: [resource, "list", query],
    queryFn: () => service.list<unknown>(query).then((r) => r.json()),
    placeholderData: keepPreviousData,
  })
}

export const useFlex = (resource: string, id: string | number): UseQueryResult<KyResponse<unknown>, Error> => {
  const service = new FlexService(resource);
  return useQuery({
    queryKey: [resource, id],
    queryFn: () => service.setIdentifier(id).get<unknown>(),
  })
}
