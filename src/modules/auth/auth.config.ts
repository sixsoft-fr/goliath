export type AuthConfig = {
    inviteOnly: boolean;
    enableSocialLogin: boolean;
    socialLoginProviders: string[];
}

export const authConfig: AuthConfig = {
    inviteOnly: true,
    enableSocialLogin: false,
    socialLoginProviders: [],
}
