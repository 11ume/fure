import querystring from 'querystring'
import { FureProvider } from 'fure-provider'
import { deleteFalsyValues, getRequiredParam } from 'fure-shared'
import { v4 as uuidv4 } from 'uuid'
import { createPkce } from 'fure-oauth2-pkce'
import { Fetch, fetch } from './fetch'

type GeneratePkceResult = {
    codeVerifier: string
    codeChallenge: string
}

type GenerateAuthUrlParams = {
    [key: string]: string | string[] | boolean
}

export interface IFureOAuth2Provider {
    generateAuth(options: Partial<IGenerateAuthOptions>): GenerateAuthResult
    authenticate(url: string, options?: GetTokenOptions): Promise<any>
    revokeToken(): boolean
}

export type GenerateAuthResult = {
    url: string
    state?: string
    codeVerifier?: string
    codeChallenge?: string
}

export interface IGenerateAuthOptions {
    /**
     * Application ID.
     */
    clientId?: string

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
}

export type GetTokenOptions = {

    /**
     * Application ID.
     */
    clientId?: string

    /**
     * The URI that you want to redirect the user logging in back to.
     */
    redirectUri?: string

    /**
     * Is a high-entropy cryptographic random string using the unreserved characters.
     */
    codeVerifier?: string
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

export class FureOAuth2Provider extends FureProvider {
    readonly provider: string
    readonly tokenUrl: string
    readonly authenticationUrl: string
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly state: boolean
    readonly scope: string[]
    protected readonly parsedRedirectUrl: URL
    protected readonly fetch?: Fetch
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
        this.fetch = fetch
        this.provider = provider
        this.tokenUrl = tokenUrl
        this.authenticationUrl = authenticationUrl
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.state = state
        this.scope = scope
        this.parsedRedirectUrl = new URL(redirectUri)
    }

    public generateAuthenticationUrl(params: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): string {
        const preparedParams = this.prepareAuthUrlParams(params, state, codeChallenge)
        const cleanedParams = deleteFalsyValues(preparedParams)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }

    protected generateAuthStateParam(state: boolean): string {
        const uuid = uuidv4()
        return state ? uuid : null
    }

    protected generatePkce(codeChallange: boolean): GeneratePkceResult {
        const pkce = createPkce()
        if (codeChallange) {
            return pkce.generate()
        }

        return {
            codeVerifier: null
            , codeChallenge: null
        }
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
}
