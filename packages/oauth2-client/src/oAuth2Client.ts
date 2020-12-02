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

export type GenerateAuthUrlParams = {
    [key: string]: string | string[] | boolean
}

export type GetTokenOptions = {
    /**
     * Authorization code.
     */
    code: string

    /**
     * Application ID.
     */
    clientId?: string

    /**
     * The URI that you want to redirect the user logging in back to.
     */
    redirectUri?: string

    /**
     * Is a high-entropy cryptographic random string using the unreserved characters..
     */
    codeVerifier?: string
}

export class OAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly tokenUrl: string
    readonly authenticationUrl: string
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

    private prepareAuthUrlParams(options: GenerateAuthUrlParams, state: string, nonce: string): GenerateAuthUrlParams {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }

        return {
            ...options
            , state
            , nonce
            , scope
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

    generateAuthenticationUrl(params: GenerateAuthUrlParams, state: string, nonce: string): string {
        const preparedParams = this.prepareAuthUrlParams(params, state, nonce)
        const cleanedParams = deleteEmptyValues(preparedParams)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }
}
