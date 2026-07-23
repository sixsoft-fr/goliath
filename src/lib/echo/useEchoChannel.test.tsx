import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

const listen = vi.fn().mockReturnThis()
const stopListening = vi.fn()
const channel = { listen, stopListening }
const privateFn = vi.fn(() => channel)
vi.mock('@/providers/echo', () => ({
    useEcho: () => ({ private: privateFn }),
}))

// eslint-disable-next-line import/first -- import sous test après les vi.mock (hoistés par vitest)
import { useEchoChannel } from './useEchoChannel'

function Probe() {
    useEchoChannel('warehouse.42', 'StockUpdated', () => {})
    return null
}

describe('useEchoChannel', () => {
    it("s'abonne au canal privé et écoute l'event", () => {
        render(<Probe />)
        expect(privateFn).toHaveBeenCalledWith('warehouse.42')
        expect(listen).toHaveBeenCalledWith('StockUpdated', expect.any(Function))
    })

    it('retire uniquement son listener au démontage (pas tout le canal partagé)', () => {
        const { unmount } = render(<Probe />)
        unmount()
        expect(stopListening).toHaveBeenCalledWith('StockUpdated', expect.any(Function))
    })
})
