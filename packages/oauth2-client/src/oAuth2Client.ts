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
     * Your application ID.
     */
    readonly clientId: string

    /**
     * Your unique app secret.
     * This app secret should never be included in client-side code or in binaries that
     * could be decompiled. It is extremely important that it remains completely secret
     * as it is the core of the security of your app and all the people using it.
     */
    readonly clientSecret: string

    /**
     *  The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
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
            , client_id: this.clientId
        })
        return `${this.authenticationUrl}?${params}`
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }
}