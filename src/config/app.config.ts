import { type AuthConfig, authConfig as auth } from "@/modules/auth/auth.config"
import { type TeamConfig, teamConfig as team } from "@/config/teams.config"
import { type ApiConfig, apiConfig as api } from "@/config/api.config"
import {
  type ReverbConfig,
  reverbConfig as reverb,
} from "@/lib/echo/reverb.config"
import {
  type SidebarConfig,
  sidebarConfig as sidebar,
} from "@/components/ds/sidebar/sidebar.config"

export type AppConfig = {
  auth: AuthConfig
  team: TeamConfig
  api: ApiConfig
  reverb: ReverbConfig
  sidebar: SidebarConfig
}

export const appConfig: AppConfig = {
  auth,
  team,
  api,
  reverb,
  sidebar,
}
