import { Navigate } from "react-router"
import type { ReactNode } from "react"
import { useAuth } from "./auth.context"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  // Attendre la fin du bootstrap avant de décider — évite un flash /login.
  if (isBootstrapping) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
