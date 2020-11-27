import querystring from 'querystring'
import { RequestInit } from 'node-fetch'

type Request = (url: string, options?: RequestInit) => Promise<Response>
type GenerateAuthUrlOptions = {
    [key: string]: any
}
interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
    readonly request: Request
}
export class OAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
    readonly request: Request
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , authenticationUrl
        , request
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.authenticationUrl = authenticationUrl
        this.request = request
    }

    generateAuthUrl(options: GenerateAuthUrlOptions): string {
        let scope: string | string[]
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }
        const mergeOpts = {
            ...options
            , scope
        }
        return this.authenticationUrl + '?' + querystring.stringify(mergeOpts)
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }
}
