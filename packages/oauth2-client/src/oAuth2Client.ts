import querystring from 'querystring'
import { Fetch, Response } from './fetch'
import { deleteEmptyValues } from 'fure-shared'
import { AuthTokenResponse, TokenCredentials, TokenRequestValues } from './credentials'

type ResponseError = {
    status: number
    , message: string
    , description: string
}

type GetTokenResponse = {
    error: ResponseError
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
     */
    readonly clientSecret: string

    /**
     * The URL that you want to redirect the person logging in back to.
     */
    readonly redirectUri: string

    /**
     * Base URL for token retrieval.
     */
    readonly tokenUrl: string

    /**
     * Base URL for handle authentication.
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
        , authenticationUrl
        , redirectUri
        , fetch
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.tokenUrl = tokenUrl
        this.redirectUri = redirectUri
        this.authenticationUrl = authenticationUrl
        this.#fetch = fetch
    }

    private prepareAuthUrlParams(options: GenerateAuthUrlOptions, state: string): GenerateAuthUrlOptions {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }

        return {
            ...options
            , scope
            , state
        }
    }

    private async handleGetTokenResponse(res: Response): Promise<GetTokenResponse> {
        const body: AuthTokenResponse = await res.json()
        if (res.ok) {
            return {
                error: null
                , credentials: body
            }
        }

        return {
            credentials: null
            , error: {
                status: res.status
                , message: body.error
                , description: body.error_description
            }
        }
    }

    /**
     * Make http request to recibe the token of endpoint service.
     * @param values request body values.
     */
    private makeGetTokenRequest(values: TokenRequestValues): Promise<Response> {
        const cleanedValues = deleteEmptyValues(values)
        const body = querystring.stringify(cleanedValues)
        return this.#fetch(this.tokenUrl, {
            body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }

    /**
     * Gets token credentials for the given code.
     * @param {GetTokenOptions} options
     * @param options.code Authorization code.
     * @param options.clientId Application ID.
     * @param options.redirectUri The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     * @param options.codeVerifier Is a high-entropy cryptographic random string using the unreserved characters.
     */
    async getTokens({
        code
        , clientId
        , redirectUri
        , codeVerifier = undefined
    }: GetTokenOptions): Promise<GetTokenResponse> {
        const grantType = 'authorization_code'
        const values = {
            code
            , grant_type: grantType
            , code_verifier: codeVerifier
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
        }

        const res = await this.makeGetTokenRequest(values)
        return this.handleGetTokenResponse(res)
    }

    /**
     * Generate URL for consent page landing.
     * @return URL to consent page.
     */
    generateAuthenticationUrl(options: GenerateAuthUrlOptions, state: string): string {
        const params = this.prepareAuthUrlParams(options, state)
        const cleanedParams = deleteEmptyValues(params)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }
}
