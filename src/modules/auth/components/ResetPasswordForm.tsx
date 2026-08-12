import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useResetPassword } from "@/modules/auth/hooks/use-reset-password"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const reset = useResetPassword()
  const { t } = useTranslation("auth")
  const [mismatch, setMismatch] = useState(false)

  // Le lien du mail porte le token (et l'email) en query. Sans token, rien à faire.
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {t("resetPassword.invalidTitle")}
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t("resetPassword.invalidBody")}
        </p>
        <Link
          to="/forgot-password"
          className="mt-2 text-sm underline underline-offset-4"
        >
          {t("resetPassword.requestNew")}
        </Link>
      </div>
    )
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get("password"))
    const password_confirmation = String(data.get("password_confirmation"))
    if (password !== password_confirmation) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    reset.mutate({ token, email, password, password_confirmation })
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("resetPassword.title")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("resetPassword.subtitle")}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">{t("resetPassword.email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            placeholder={t("resetPassword.emailPlaceholder")}
            required
            readOnly={Boolean(email)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">
            {t("resetPassword.newPassword")}
          </FieldLabel>
          <Input id="password" name="password" type="password" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password_confirmation">
            {t("resetPassword.confirmPassword")}
          </FieldLabel>
          <Input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            required
          />
        </Field>
        <Field>
          {mismatch && (
            <FieldDescription className="text-center text-destructive">
              {t("resetPassword.mismatch")}
            </FieldDescription>
          )}
          {reset.isError && (
            <FieldDescription className="text-center text-destructive">
              {reset.error.message}
            </FieldDescription>
          )}
          <Button type="submit" disabled={reset.isPending}>
            {reset.isPending
              ? t("resetPassword.submitPending")
              : t("resetPassword.submit")}
          </Button>
          <FieldDescription className="text-center">
            <Link to="/login" className="underline underline-offset-4">
              {t("resetPassword.backToLogin")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
