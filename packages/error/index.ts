export class FureError extends Error {
    constructor(
        readonly message: string
        , readonly description?: string
        , readonly statusCode?: number
        , readonly originalError?: Error) {
        super(message)
    }
}

export const createError = (code: number
    , message?: string
    , description?: string
    , error?: Error) => {
    const cod = code ?? 500
    if (code > 511 || code < 100) {
        throw new Error(`Invalid status code ${code}`)
    }
    return new FureError(message, description, cod, error)
}
