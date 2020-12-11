import { Response } from 'node-fetch'
import { Fetch, fetch } from './fetch'
import { createError } from 'fure-error'
export { Response } from 'node-fetch'

export type RequestHeaders = {
    [key: string]: string
}

export type RequestOptions = {
    url: string
    body: string
    method: string
    headers: RequestHeaders
}

export type ResponseOptions<T> = {
    value: T
    , errorMessage?: string
}

type ResponseErrorBody = {
    error?: string
    error_description?: string
}

type ResponseError = {
    status: number
    message: string
    description: string
}

export class Transport {
    fetch: Fetch
    constructor() {
        this.fetch = fetch
    }

    public request({
        url
        , body
        , method
        , headers
    }: RequestOptions): Promise<Response> {
        const res = this.fetch(url, {
            body
            , method
            , headers
        })

        return res
    }

    public async response<T>(res: Response, options: ResponseOptions<T>): Promise<T> {
        const {
            value
            , errorMessage = 'Unknown'
        } = options
        if (res.ok) return value
        const err = this.handleResponseError(res.status, value, errorMessage)
        const { status, message, description } = err
        throw createError(status, message, description)
    }

    private handleResponseError(status: number
        , value: ResponseErrorBody
        , defaultErrorMessage: string): ResponseError {
        const message = value.error ?? defaultErrorMessage
        const description = value.error_description ?? 'No description.'
        const error = {
            status
            , message
            , description
        }

        return error
    }
}

const createTransport = () => new Transport()
export default createTransport
