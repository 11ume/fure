import { FureError } from './error'

export class FureProvider {
    /**
     * Name of authentication provider entity.
     */
    protected readonly provider: string
    constructor(provider: string) {
        this.provider = provider
    }

    /**
     * Common error handler.
     * @param code http status code
     * @param message message of the error
     * @param description message of the error
     * @param error original error
     **/
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
