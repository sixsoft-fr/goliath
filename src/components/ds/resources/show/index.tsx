import { useSubject, type Model } from "@/modules/core"
import { useFlex } from "@/modules/flex"
import { useEffect } from "react"
import { useParams } from "react-router"

export function Show() {
  const { resource, identifier } = useParams()

  if (!resource) throw new Error("Cannot use SHOW page without resource")
  if (!identifier) throw new Error("Cannot use SHOW page without identifier")

  // SubjectProvider is already mounted by <Page> in AppLayout.
  const { setIdentifier, setResource, setModel, model } = useSubject()

  useEffect(() => {
    setResource(resource).setIdentifier(identifier)
  }, [resource, identifier, setResource, setIdentifier])

  const { data, isLoading, isError, error } = useFlex<
    Model & Record<string, unknown>
  >(resource, identifier)

  useEffect(() => {
    if (!data) return
    setModel(data)
    console.log({ data })
  }, [data, setModel])

  if (isLoading) return <h1>Loading…</h1>
  if (isError) return <h1>Error: {error.message}</h1>

  return (
    <h1>
      Show me from {resource} the one with identifier {model?.id} named {model?.name!}
    </h1>
  )
}

export default Show
