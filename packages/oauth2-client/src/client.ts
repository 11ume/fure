import querystring from 'querystring'
// import fetch from 'node-fetch'

interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
}

export type GenerateAuthUrlOptions = {
    [key: string]: any
}
export class OAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , authenticationUrl
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.authenticationUrl = authenticationUrl
    }

    generateAuthUrl(options: GenerateAuthUrlOptions): string {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }
        const params = querystring.stringify({
            ...options
            , scope
        })
        return `${this.authenticationUrl}?${params}`
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }
}
