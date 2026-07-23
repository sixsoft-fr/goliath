import { appConfig } from '@/config/app.config'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export function createEcho(token: string | null): Echo<'reverb'> {
    // pusher-js doit être global pour le broadcaster reverb (protocole Pusher)
    ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

    return new Echo({
        broadcaster: 'reverb',
        key: appConfig.reverb.key,
        wsHost: appConfig.reverb.host,
        wsPort: appConfig.reverb.port,
        wssPort: appConfig.reverb.port,
        forceTLS: appConfig.reverb.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        // /broadcasting/auth est à la racine Laravel, pas sous /api
        authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`,
        auth: { headers: { Authorization: `Bearer ${token ?? ''}` } },
    })
}
