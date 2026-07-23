export type ApiConfig = {
    baseUrl: string;
}

if (!import.meta.env.VITE_API_URL) {
    throw new Error("VITE_API_URL is not set");
}

export const apiConfig: ApiConfig = {
    baseUrl: import.meta.env.VITE_API_URL,
}