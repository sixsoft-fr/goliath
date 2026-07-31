import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"
import { useAuth } from "../auth.context"
import type { AuthSession, LoginPayload } from "../types"

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    // Le endpoint POST /auth renvoie { token, user } ; on le mappe vers la forme
    // interne AuthSession ({ accessToken, user }) utilisée par login() et le refresh.
    mutationFn: async (payload: LoginPayload): Promise<AuthSession> => {
      const { token, user } = await api
        .post("auth", { json: payload })
        .json<{ token: string; user: AuthSession["user"] }>()
      return { accessToken: token, user }
    },
    onSuccess: (session) => {
      login(session)
      navigate("/app")
    },
  })
}
