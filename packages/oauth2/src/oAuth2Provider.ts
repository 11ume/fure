import querystring from 'querystring'
import { randomBytes } from 'crypto'
import { FureProvider } from 'fure-provider'
import { getRequiredParam } from 'fure-shared'
import { v4 as uuidv4 } from 'uuid'
import createOAuth2Client, { OAuth2Client, GetTokenOptions } from 'fure-oauth2-client'

export interface IGenerateAuthParams {
    /**
     * @required
     * Determines whether the response data included when the redirect back to the app occurs is in URL parameters or fragments. See the Confirming Identity section to choose which type your app should use.
     * This can be one of:
     * @value code - Response data is included as URL parameters and contains code parameter (an encrypted string unique to each login request). This is the default behavior if this parameter is not specified.
     * It's most useful when your server will be handling the token.
     * @value token - Response data is included as a URL fragment and contains an access token. Desktop apps must use this setting for response_type. This is most
     * useful when the client will be handling the token.
     */
    responseType?: string

    /**
     * @required
     * Determines where the API server redirects the user after the user completes
     * the authorization flow.
     */
    redirectUri?: string

    /**
     * @required
     * A space-delimited list of scopes that identify the resources that your application
     * could access on the user's behalf. Scopes enable your application to only request access
     * to the resources that it needs while also enabling users to control the amount of access that
     * they grant to your application.
     */
    scope?: string[] | string

    /**
     * @recommended
     * A string value for maintain state between the request and callback.
     * This parameter should be used for preventing Cross-site Request Forgery and will be passed
     * back to you, unchanged, in your redirect URI.
     */
    state?: boolean

    /**
    * @recommended
    * Specifies what method was used to encode a 'code_verifier'
    * that will be used during authorization code exchange. This parameter must
    * be used with the 'code_challenge' parameter. The value of the
    * 'code_challenge_method' defaults to "plain" if not present in the request
    * that includes a 'code_challenge'. The only supported values for this
    * parameter are "S256" or "plain".
    */
    codeChallengeMethod?: CodeChallengeMethod

    /**
     * @recommended
     * Specifies an encoded 'code_verifier' that will be used as a
     * server-side challenge during authorization code exchange. This parameter
     * must be used with the 'code_challenge' parameter described above.
     */
    codeChallenge?: string
}

export enum CodeChallengeMethod {
    plain = 'plain'
    , S256 = 'S256'
}

export type GenerateAuthResult = {
    url: string
    state?: string
}

export interface IFureOAuth2Provider {
    generateAuth(options: Partial<IGenerateAuthParams>): GenerateAuthResult
    authenticate(url: string, options?: GetTokenOptions): Promise<any>
    revokeToken(): boolean
}

export interface OAuth2ProviderOptions {
    readonly provider: string
    readonly tokenUrl: string
    readonly authenticationUrl: string
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly state?: boolean
    readonly scope?: string[]
}

export type GetTokenOptionsProvider = Omit<GetTokenOptions, 'code' | 'codeVerifier'>

export class FureOAuth2Provider extends FureProvider {
    readonly state: boolean
    readonly scope: string[]
    readonly #oAuth2Client: OAuth2Client
    protected readonly parsedRedirectUrl: URL
    protected constructor({
        provider
        , tokenUrl
        , authenticationUrl
        , clientId
        , clientSecret
        , redirectUri
        , state
        , scope
    }: OAuth2ProviderOptions) {
        super(provider)
        this.state = state
        this.scope = scope
        this.#oAuth2Client = createOAuth2Client({
            clientId
            , clientSecret
            , tokenUrl
            , authenticationUrl
            , redirectUri
        })
        this.parsedRedirectUrl = new URL(redirectUri)
    }

    get clientId() {
        return this.#oAuth2Client.clientId
    }

    get clientSecret() {
        return this.#oAuth2Client.clientSecret
    }

    get redirectUri() {
        return this.#oAuth2Client.redirectUri
    }

    get authenticationUrl() {
        return this.#oAuth2Client.authenticationUrl
    }

    get tokenUrl() {
        return this.#oAuth2Client.tokenUrl
    }

    protected generateAuthStateParam(state: boolean): string {
        const uuid = uuidv4()
        return state ? uuid : null
    }

    protected generateAuthNonceParam(nonce: boolean): string {
        const str = randomBytes(16).toString('hex') // 32 bytes
        return nonce ? str : null
    }

    protected generateAuthenticationUrl(params: Partial<IGenerateAuthParams>, state: string, nonce: string): string {
        return this.#oAuth2Client.generateAuthenticationUrl(params, state, nonce)
    }

    protected getQueryObjectFromUrl(currentUrl: URL): querystring.ParsedUrlQuery {
        const urlWhioutQuestionMark = currentUrl.search.slice(1)
        return querystring.parse(urlWhioutQuestionMark)
    }

    protected getRequiredParam(id: string, parsedredirectUri: querystring.ParsedUrlQuery): string {
        const param = getRequiredParam(id, parsedredirectUri[id])
        if (param) return param
        throw this.error(401, `Required param ${id}`, `The ${id} param is missing, or it has been altered.`)
    }

    protected async getTokens(options: GetTokenOptions) {
        return this.#oAuth2Client.getTokens(options)
    }
}
