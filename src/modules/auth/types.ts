export type User = {
  id: string
  email: string
  name?: string
}

export type AuthSession = {
  user: User
  accessToken: string
}

export type LoginPayload = {
  email: string
  password: string
}
