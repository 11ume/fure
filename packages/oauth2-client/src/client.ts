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
    /**
     * The client ID for your application.
     * You can find this value in the API Console of you auth provider.
     */
    readonly clientId: string

    /**
     * The unique key of you application.
     * You can find this value in the API Console of you auth provider.
     */
    readonly clientSecret: string

    /**
     * The URI to redirect to after completing the auth request.
     */
    readonly redirectUri: string

    /**
     * URL used for create an authorization request link.
     */
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
