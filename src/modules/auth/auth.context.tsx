/* eslint-disable react-refresh/only-export-components */
import { createContext, use, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { setAccessToken } from "./token-store"
import { attemptSilentRefresh } from "./session"
import type { AuthSession, User } from "./types"

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (session: AuthSession) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  function login(session: AuthSession) {
    setAccessToken(session.accessToken)
    setUser(session.user)
  }

  function logout() {
    setAccessToken(null)
    setUser(null)
  }

  useEffect(() => {
    let cancelled = false
    attemptSilentRefresh().then((session) => {
      if (cancelled) return
      if (session) login(session)
      setIsBootstrapping(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext
      value={{ user, isAuthenticated: user !== null, isBootstrapping, login, logout }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
