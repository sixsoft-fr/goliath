import { describe, it, expect, vi, beforeEach } from 'vitest'

const echoCtor = vi.fn()
vi.mock('laravel-echo', () => ({
    default: class {
        options: unknown
        constructor(options: unknown) {
            echoCtor(options)
            this.options = options
        }
    },
}))
vi.mock('pusher-js', () => ({ default: class {} }))

// eslint-disable-next-line import/first -- import sous test après les vi.mock (hoistés par vitest)
import { createEcho } from './echo'

type EchoOptions = {
    broadcaster: string
    authEndpoint: string
    auth: { headers: { Authorization: string } }
}

describe('createEcho', () => {
    beforeEach(() => echoCtor.mockClear())

    it('configure le broadcaster reverb avec auth Bearer', () => {
        createEcho('tok-123')
        const opts = echoCtor.mock.calls[0][0] as EchoOptions
        expect(opts.broadcaster).toBe('reverb')
        expect(opts.authEndpoint).toContain('/broadcasting/auth')
        expect(opts.auth.headers.Authorization).toBe('Bearer tok-123')
    })
})
