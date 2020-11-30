import querystring from 'querystring'
import { Fetch } from './fetch'
import { deleteEmptyValues, createError, InteralError } from 'fure-shared'
import { AuthTokenResponse, TokenCredentials } from './credentials'

type GetTokenResponse = {
    error: InteralError
    credentials: Partial<TokenCredentials>
}

export interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
    readonly tokenUrl: string
    readonly fetch?: Fetch
}

export type GenerateAuthUrlOptions = {
    [key: string]: string | string[] | boolean
}

export type GetTokenOptions = {
    code: string
    clientId?: string
    redirectUri?: string
    codeVerifier?: string
}

export class OAuth2Client {
    /**
     * Application ID.
     */
    readonly clientId: string

    /**
     * Application unique secret key.
     * This application secret key should never be included in client-side code or in binaries that
     * could be decompiled. It is extremely important that it remains completely secret
     * as it is the core of the security of your app and all the people using it.
     */
    readonly clientSecret: string

    /**
     * URL used for create an authorization token.
     */
    readonly tokenUrl: string

    /**
     * The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     */
    readonly redirectUri: string

    /**
     * URL used for create an authorization request link.
     */
    readonly authenticationUrl: string

    /**
     * Request agent abstraction interface.
     */
    readonly #fetch: Fetch

    constructor({
        clientId
        , clientSecret
        , tokenUrl
        , redirectUri
        , authenticationUrl
        , fetch
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.tokenUrl = tokenUrl
        this.redirectUri = redirectUri
        this.authenticationUrl = authenticationUrl
        this.#fetch = fetch
    }

    private prepareAuthUrlParams(options: GenerateAuthUrlOptions): GenerateAuthUrlOptions {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }

        return {
            ...options
            , scope
        }
    }

    /**
     * Generate URI for consent page landing.
     * @return URI to consent page.
     */
    generateAuthenticationUrl(options: GenerateAuthUrlOptions): string {
        const params = this.prepareAuthUrlParams(options)
        const cleanedParams = deleteEmptyValues(params)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }

    /**
     * Gets the access token for the given code.
     * @typedef {GetTokenOptions}
     * @param {string} GetTokenOptions.code Authorization code.
     * @param {string} GetTokenOptions.clientId Application ID.
     * @param {string} GetTokenOptions.redirectUri The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     * @param {string} GetTokenOptions.codeVerifier Is a high-entropy cryptographic random string using the unreserved characters .
     */
    async getToken({
        code
        , clientId
        , redirectUri
        , codeVerifier = undefined
    }: GetTokenOptions): Promise<GetTokenResponse> {
        const grantType = 'authorization_code'
        const values = {
            code
            , client_secret: this.clientSecret
            , code_verifier: codeVerifier
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
            , grant_type: grantType
        }

        const cleanedValues = deleteEmptyValues(values)
        const res = await this.#fetch(this.tokenUrl, {
            method: 'POST'
            , body: querystring.stringify(cleanedValues)
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const body: AuthTokenResponse = await res.json()
        if (res.ok) {
            return {
                error: null
                , credentials: body
            }
        }

        const error = createError(res.status, body.error, body.error_description)
        return {
            error
            , credentials: null
        }
    }
}
