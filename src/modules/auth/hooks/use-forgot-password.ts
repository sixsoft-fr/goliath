import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

// ponytail: endpoint assumed `POST /auth/forgot-password` {email} (Laravel
// convention, cf. login qui poste sur `auth`). Ajuster si l'API diffère.
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string): Promise<void> => {
      await api.post("auth/forgot-password", { json: { email } }).json()
    },
  })
}
