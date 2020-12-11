import { Response } from 'node-fetch'
import { Fetch, fetch } from './fetch'
import { createError } from 'fure-error'

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
    res: Response
    , value: T
    , defaultErrorMessage?: string
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

    public async response<T>(options: ResponseOptions<T>): Promise<T> {
        const {
            res
            , value
            , defaultErrorMessage = 'Unknown'
        } = options
        if (res.ok) return value
        const err = this.handleResponseError(res.status, value, defaultErrorMessage)
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
