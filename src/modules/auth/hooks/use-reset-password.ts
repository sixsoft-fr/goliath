import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"

export type ResetPasswordPayload = {
  token: string
  email: string
  password: string
  password_confirmation: string
}

// ponytail: endpoint assumed `POST /auth/reset-password` (Laravel convention).
// Ajuster si l'API diffère.
export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload): Promise<void> => {
      await api.post("auth/reset-password", { json: payload }).json()
    },
    onSuccess: () => navigate("/login"),
  })
}
