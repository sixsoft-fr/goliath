import { Page } from "@/modules/core/Page"

export function NotFound() {
  return (
    <Page>
      <div className="flex min-h-svh p-6">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
          <h1 className="font-medium">Page not found</h1>
        </div>
      </div>
    </Page>
  )
}