import { type AuthConfig, authConfig as auth } from "@/modules/auth/auth.config";
import { type TeamConfig, teamConfig as team } from "@/config/teams.config";
import { type ApiConfig, apiConfig as api } from "@/config/api.config";

export type AppConfig = {
    auth: AuthConfig;
    team: TeamConfig;
    api: ApiConfig;
}

export const appConfig: AppConfig = {
    auth,
    team,
    api,
}
