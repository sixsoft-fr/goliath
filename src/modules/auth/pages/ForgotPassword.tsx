import { Navigate } from "react-router"
import { AuthShell } from "@/modules/auth/components/AuthShell"
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm"
import { useAuth } from "@/modules/auth/auth.context"

export function ForgotPassword() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return null
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  )
}

export default ForgotPassword
