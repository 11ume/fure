import querystring from 'querystring'
import { Fetch, Response } from './fetch'
import { deleteFalsyValues } from 'fure-shared'
import { AuthTokenResponse, TokenCredentials, TokenRequestValues } from './credentials'

type ResponseError = {
    status: number
    message: string
    description: string
}

type GetTokenResponse = {
    error: ResponseError
    credentials: Partial<TokenCredentials>
}

enum GrantTypes {
    authorizationCode = 'authorization_code'
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

export interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
    readonly tokenUrl: string
    readonly fetch?: Fetch
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

    async getTokens({
        code
        , clientId
        , redirectUri
        , codeVerifier = null
    }: GetTokenOptions): Promise<GetTokenResponse> {
        const values = {
            code
            , grant_type: GrantTypes.authorizationCode
            , code_verifier: codeVerifier
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
        }

        const res = await this.makeGetTokenRequest(values)
        return this.handleGetTokenResponse(res)
    }

    generateAuthenticationUrl(params: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): string {
        const preparedParams = this.prepareAuthUrlParams(params, state, codeChallenge)
        const cleanedParams = deleteFalsyValues(preparedParams)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }

    private prepareAuthUrlParams(options: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): GenerateAuthUrlParams {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }

        return {
            ...options
            , state
            , scope
            , code_challenge: codeChallenge
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

        const status = res.status
        const message = body.error ?? 'Get token response error.'
        const description = body.error_description ?? 'No description.'
        return {
            credentials: null
            , error: {
                status
                , message
                , description
            }
        }
    }

    private makeGetTokenRequest(values: TokenRequestValues): Promise<Response> {
        const cleanedValues = deleteFalsyValues(values)
        const body = querystring.stringify(cleanedValues)
        return this.#fetch(this.tokenUrl, {
            body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}
