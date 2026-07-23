import type { Model } from "@/modules/core"

export type User = Model & {
  email: string
  emailVerifiedAt: Date | null

  name: string
  locale: string;
  avatar: string | null;
  slug: string

  account_id: number;
}

export type AuthSession = {
  user: User
  accessToken: string
}

export type LoginPayload = {
  email: string
  password: string
}
