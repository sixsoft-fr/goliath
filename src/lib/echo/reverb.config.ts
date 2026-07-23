export type ReverbConfig = {
    key: string;
    host: string;
    port: number;
    scheme: string;
}

export const reverbConfig: ReverbConfig = {
    key: import.meta.env.VITE_REVERB_KEY,
    host: import.meta.env.VITE_REVERB_HOST,
    port: Number(import.meta.env.VITE_REVERB_PORT),
    scheme: import.meta.env.VITE_REVERB_SCHEME,
}
