import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "@/lib/i18n"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { BrowserRouter } from "react-router"
import { QueryProvider } from "@/lib/query"
import { AuthProvider } from "@/modules/auth/auth.context"
import { EchoProvider } from "@/lib/echo/echo.provider"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <EchoProvider>
            <ThemeProvider>
              <TooltipProvider>
                <Suspense fallback={<Spinner className="size-8 w-full" />}>
                  <App />
                </Suspense>
              </TooltipProvider>
            </ThemeProvider>
          </EchoProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
)
