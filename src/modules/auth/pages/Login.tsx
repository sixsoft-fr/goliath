import { HugeiconsIcon } from "@hugeicons/react"
import { GalleryVerticalEndIcon } from "@hugeicons/core-free-icons"
import { Navigate } from "react-router"
import { LoginForm } from "@/modules/auth/components/LoginForm"
import { useAuth } from "@/modules/auth/auth.context"
import lin from "@/assets/lin.jpg"

export function Login() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  // Symétrique de RequireAuth : attendre le bootstrap, puis si une session a
  // été restaurée (cookie de refresh valide), ne pas afficher le formulaire.
  if (isBootstrapping) return null
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <HugeiconsIcon icon={GalleryVerticalEndIcon} className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src={lin}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}

export default Login