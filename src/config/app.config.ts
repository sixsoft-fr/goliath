import { type AuthConfig, authConfig as auth } from "@/modules/auth/auth.config";

export type AppConfig = {
    auth: AuthConfig;
}

export const appConfig: AppConfig = {
    auth,
}
