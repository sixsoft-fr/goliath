# Echo — realtime (Laravel Reverb)

Client WebSocket branché sur Laravel Reverb via `laravel-echo` + protocole Pusher.

## Setup

1. Variables d'env (voir `.env.example`) :

```
VITE_REVERB_KEY=...
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

2. Monter le provider **sous** le `QueryClientProvider` et après l'auth (il lit le token via `getAccessToken()`) :

```tsx
<QueryClientProvider client={queryClient}>
    <EchoProvider>
        <App />
    </EchoProvider>
</QueryClientProvider>
```

Le provider :
- ne crée la connexion que si un token est présent (rien en anonyme),
- recrée la connexion à chaque changement de token, coupe au logout,
- invalide les queries `['stats', 'read']` et `['notifications']` à chaque **re**connexion (trou réseau) pour resynchroniser les données.

## Écouter un événement : `useEchoChannel`

Cas standard — un composant qui écoute un canal privé :

```tsx
import { useEchoChannel } from '@/lib/echo/useEchoChannel'

function StoreStatChart({ warehouseId }: { warehouseId: string }) {
    const queryClient = useQueryClient()

    useEchoChannel(
        `warehouse.${warehouseId}`,   // canal privé (sans le préfixe "private-")
        '.stats.updated',             // nom de l'event broadcast côté Laravel
        (payload) => {
            // payload = données broadcast par l'event Laravel
            queryClient.invalidateQueries({ queryKey: ['stats', warehouseId] })
        },
    )

    // ...
}
```

Points clés :
- **Canal `null` = pas d'abonnement.** Pratique pour attendre une donnée :
  `useEchoChannel(warehouseId ? `warehouse.${warehouseId}` : null, ...)`
- Le handler est toujours à jour (ref interne) — pas besoin de le mémoïser avec `useCallback`.
- Le cleanup retire **uniquement ce listener**, pas le canal : plusieurs composants peuvent écouter le même canal sans se marcher dessus.
- Les canaux sont **privés** (`echo.private()`) : l'autorisation passe par `POST /broadcasting/auth` côté Laravel avec le Bearer token. Il faut donc une route d'autorisation dans `routes/channels.php`.

## Accès direct à l'instance Echo

Pour les cas non couverts par le hook (presence channels, whisper, etc.) :

```tsx
import { useEcho } from '@/lib/echo/echo.provider'

const echo = useEcho() // Echo<'reverb'> | null — null tant que pas connecté
echo?.join(`room.${id}`)         // presence channel
    .here((users) => { ... })
    .joining((user) => { ... })
```

Si vous utilisez l'instance directement, pensez à `echo.leave(channel)` dans le cleanup — contrairement au hook, rien n'est géré pour vous.

## Côté Laravel (rappel)

```php
// L'event doit implémenter ShouldBroadcast
public function broadcastOn(): array
{
    return [new PrivateChannel("warehouse.{$this->warehouseId}")];
}

public function broadcastAs(): string
{
    return 'stats.updated'; // écouté en front avec le préfixe "." → '.stats.updated'
}
```

Le `.` devant le nom de l'event côté front (`'.stats.updated'`) indique à Echo de ne pas préfixer avec le namespace PHP (`App\Events\...`).
