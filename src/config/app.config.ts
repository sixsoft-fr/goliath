import { type AuthConfig, authConfig as auth } from "@/modules/auth/auth.config";
import { type TeamConfig, teamConfig as team } from "@/config/teams.config";

export type AppConfig = {
    auth: AuthConfig;
    team: TeamConfig;
}

export const appConfig: AppConfig = {
    auth,
    team,
}
