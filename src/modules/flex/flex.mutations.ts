import { api } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"

export const useFlexCreate = () => {
  /**
   * It should: 
   * 
   * - find the meta fields for the resource
   * - find the meta validation for the resource
   * - build zod schema from the meta fields and validation
   * - validate the data against the zod schema
   * - create the resource via the api call
   * - return the created resource, typed with the zod schema when possible
   */
  return useMutation({
    mutationFn: ({ resource, data }: { resource: string; data: unknown }) => {
      return api.post(`/${resource}`, { json: data })
    },
  })
}

export const useFlexUpdate = () => {
  return useMutation({
    mutationFn: ({
      resource,
      identifier,
      data,
    }: {
      resource: string
      identifier: string
      data: unknown
    }) => {
      return api.patch(`/${resource}/${identifier}`, { json: data })
    },
  })
}