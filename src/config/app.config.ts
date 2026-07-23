import { type AuthConfig, authConfig as auth } from "@/modules/auth/auth.config";
import { type TeamConfig, teamConfig as team } from "@/config/teams.config";
import { type ApiConfig, apiConfig as api } from "@/config/api.config";
import { type ReverbConfig, reverbConfig as reverb } from "@/lib/echo/reverb.config";

export type AppConfig = {
    auth: AuthConfig;
    team: TeamConfig;
    api: ApiConfig;
    reverb: ReverbConfig;
}

export const appConfig: AppConfig = {
    auth,
    team,
    api,
    reverb,
}
