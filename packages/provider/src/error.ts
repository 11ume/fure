export class InteralError extends Error {
    constructor(
        readonly message: string
        , readonly statusCode?: number
        , readonly originalError?: Error) {
        super(message)
    }
}

export const createError = (code: number, message?: string, error?: Error) => {
    const cod = code ?? 500
    if (code > 511 || code < 100) {
        throw new Error(`Invalid status code ${code}`)
    }
    return new InteralError(message, cod, error)
}
