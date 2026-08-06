import { type PaginatedResponse, type TableQueries } from "@/modules/core"
import type { KyResponse } from "ky"
import { usersService } from "./users.service"
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"
import type { User } from "./users.types"

// Dé-wrappe le KyResponse en PaginatedResponse pour la DataTable (data + meta).
// keepPreviousData : anti-flash au changement de filtre/tri/page.
export const useUsers = (
  query: TableQueries
): UseQueryResult<PaginatedResponse<User>, Error> => {
  return useQuery({
    queryKey: ["users", "list", query],
    queryFn: () => usersService.list<User>(query).then((r) => r.json()),
    placeholderData: keepPreviousData,
  })
}

export const useUser = (
  id: string
): UseQueryResult<KyResponse<User>, Error> => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => usersService.setIdentifier(id).get<User>(),
  })
}
