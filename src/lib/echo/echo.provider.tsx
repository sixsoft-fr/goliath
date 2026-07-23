import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type Echo from 'laravel-echo'
import { useQueryClient } from '@tanstack/react-query'
import { createEcho } from '@/lib/echo/echo'
import { getAccessToken } from '@/modules/auth/token-store'

const EchoContext = createContext<Echo<'reverb'> | null>(null)

export const useEcho = () => useContext(EchoContext)

export const EchoProvider = ({ children }: { children: ReactNode }) => {
    const token = getAccessToken()
    const queryClient = useQueryClient()
    const [echo, setEcho] = useState<Echo<'reverb'> | null>(null)

    useEffect(() => {
        // ponytail: token peut être une Promise si le storage est async (cookies) ;
        // Echo ne supporte qu'un token synchrone (la stratégie active est localStorage).
        // `!token` couvre aussi le logout (token vidé à '') pour ne pas rouvrir le socket.
        if (!token || typeof token !== 'string') {
            setEcho(null)
            return
        }
        const instance = createEcho(token)
        // resync après un trou réseau : 'connected' se déclenche AUSSI à la première
        // connexion (déjà couverte par le fetch initial des queries) — on n'invalide
        // donc qu'aux reconnexions suivantes pour éviter un refetch redondant.
        let hasConnected = false
        instance.connector.pusher.connection.bind('connected', () => {
            if (hasConnected) {
                queryClient.invalidateQueries({ queryKey: ['stats', 'read'] })
                queryClient.invalidateQueries({ queryKey: ['notifications'] })
            }
            hasConnected = true
        })
        setEcho(instance)
        // recrée à chaque changement de token, déconnecte à la sortie
        return () => instance.disconnect()
    }, [token, queryClient])

    return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>
}
