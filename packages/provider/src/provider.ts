import { FureError } from './error'

export class FureProvider {
    protected readonly provider: string
    constructor(provider: string) {
        this.provider = provider
    }

    error(code: number
        , message?: string
        , description?: string
        , error?: Error) {
        const cod = code ?? 500
        if (code > 511 || code < 100) {
            throw new Error(`Invalid status code ${code}`)
        }
        return new FureError(message, description, cod, error)
    }
}
