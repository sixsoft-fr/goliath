import { useEffect, useRef } from 'react'
import { useEcho } from '@/lib/echo/echo.provider'

export function useEchoChannel(
    channel: string | null,
    event: string,
    handler: (payload: unknown) => void,
) {
    const echo = useEcho()
    // garde le handler à jour sans réabonner à chaque render
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        if (!echo || !channel) return
        const callback = (payload: unknown) => handlerRef.current(payload)
        const ch = echo.private(channel)
        ch.listen(event, callback)
        // ne retire que CE listener : un echo.leave() couperait le canal partagé par
        // d'autres composants abonnés au même warehouse (ex. deux StoreStatChart).
        return () => {
            ch.stopListening(event, callback)
        }
    }, [echo, channel, event])
}
