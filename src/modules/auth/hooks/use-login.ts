import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { api } from "@/lib/api"
import { useAuth } from "../auth.context"
import type { AuthSession, LoginPayload } from "../types"

export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post("auth", { json: payload }).json<AuthSession>(),
    onSuccess: (session) => {
      login(session)
      navigate("/app")
    },
  })
}
