import { createError } from './error'

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
     * @param status http status code
     * @param message message of the error
     * @param error original error
     **/
    error(status: number, message?: string, error?: Error) {
        return createError(status, message, error)
    }
}
