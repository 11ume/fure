export class FureError extends Error {
    constructor(
        readonly message: string
        , readonly description?: string
        , readonly statusCode?: number
        , readonly originalError?: Error) {
        super(message)
    }
}
