import { Navigate } from "react-router"
import { AuthShell } from "@/modules/auth/components/AuthShell"
import { ResetPasswordForm } from "@/modules/auth/components/ResetPasswordForm"
import { useAuth } from "@/modules/auth/auth.context"

export function ResetPassword() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return null
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  )
}

export default ResetPassword
