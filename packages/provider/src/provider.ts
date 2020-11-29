import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { createError } from './error'

export class FureProvider {
    /**
     * Name of authentication provider entity.
     */
    protected readonly provider: string
    constructor(provider: string) {
        this.provider = provider
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        return fetch(url, init)
    }

    error(status: number, message?: string, error?: Error) {
        return createError(status, message, error)
    }
}
