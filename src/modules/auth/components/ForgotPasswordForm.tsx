import { Link } from "react-router"
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
import { useForgotPassword } from "@/modules/auth/hooks/use-forgot-password"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const forgot = useForgotPassword()
  const { t } = useTranslation("auth")

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    forgot.mutate(String(data.get("email")))
  }

  if (forgot.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {t("forgotPassword.successTitle")}
        </h1>
        <p className="text-sm text-balance text-muted-foreground">
          {t("forgotPassword.successBody")}
        </p>
        <Link
          to="/login"
          className="mt-2 text-sm underline underline-offset-4"
        >
          {t("forgotPassword.backToLogin")}
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("forgotPassword.title")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("forgotPassword.subtitle")}
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">{t("forgotPassword.email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder")}
            required
          />
        </Field>
        <Field>
          {forgot.isError && (
            <FieldDescription className="text-center text-destructive">
              {forgot.error.message}
            </FieldDescription>
          )}
          <Button type="submit" disabled={forgot.isPending}>
            {forgot.isPending
              ? t("forgotPassword.submitPending")
              : t("forgotPassword.submit")}
          </Button>
          <FieldDescription className="text-center">
            {t("forgotPassword.rememberPassword")}{" "}
            <Link to="/login" className="underline underline-offset-4">
              {t("forgotPassword.backToLogin")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
