import { RequestInit } from 'node-fetch'
export { RequestInit as RequestOptions } from 'node-fetch'

export interface IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    generateAuthUrl(): string
    callbackHandler(): any
    revokeToken(): any
}

export type RequestClient = (url: string, options?: RequestInit) => Promise<Response>
