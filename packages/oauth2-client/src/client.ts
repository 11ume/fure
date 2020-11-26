import { RequestInit } from 'node-fetch'

export type Request = (url: string, options?: RequestInit) => Promise<Response>

export interface IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    generateAuthUrl(): string
    callbackHandler(): any
    revokeToken(): any
}

interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly request: Request
}

export class OAuth2Client implements IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly #request: Request
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , request
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.#request = request
    }

    generateAuthUrl(): string {
        return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }
}
