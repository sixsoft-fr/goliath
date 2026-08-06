import { Spinner } from "@/components/ui/spinner"
import { type FC, type PropsWithChildren, Suspense } from "react"
import { useLocation } from "react-router"
import { SubjectProvider } from "@/modules/core/context/subject.context"

export const Page: FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation()
  return (
    <Suspense
      key={location.key}
      fallback={<Spinner className="size-8 w-full" />}
    >
      <SubjectProvider>{children}</SubjectProvider>
    </Suspense>
  )
}
