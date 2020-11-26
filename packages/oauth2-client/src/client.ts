import { IOAuth2Client, RequestClient, RequestOptions } from './types'

interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly requestClient: RequestClient
}

export class OAuth2Client implements IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly #requestClient: RequestClient
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , requestClient
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.#requestClient = requestClient
    }

    async request(url: string, options: RequestOptions) {
        const result = await this.#requestClient(url, options)
        return {
            raw: result
            , status: result.status
        }
    }

    generateAuthUrl(): string {
        return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() {}
}
