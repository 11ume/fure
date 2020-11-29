export class InteralError extends Error {
    constructor(
        public readonly message: string
        , public readonly statusCode?: number
        , public readonly originalError?: Error) {
        super(message)
    }
}

export const createError = (status: number, message?: string, error?: Error) => {
    if (status > 511 || status < 100) {
        throw new Error(`Invalid status code ${status}`)
    }
    return new InteralError(message, status, error)
}
