import querystring from 'querystring'
import { FureProvider } from 'fure-provider'
import { IStorage, isStore } from 'fure-storage'
import { getRequiredParam } from 'fure-shared'
import { UniqueSessionTokenManager, IUniqueSessionTokenManager } from 'fure-ustm'
import createOAuth2Client, { OAuth2Client, GetTokenOptions } from 'fure-oauth2-client'

export type AccessType = 'offline' | 'online'

export interface IGenerateAuthUrlOptions {
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

export interface IFureOAuth2Provider {
    generateAuthUrl(options: Partial<IGenerateAuthUrlOptions>): string
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
    readonly store?: IStorage
    readonly state?: boolean
    readonly scope?: string[]
}

export type GetTokenOptionsProvider = Omit<GetTokenOptions, 'code' | 'codeVerifier'>

export class FureOAuth2Provider extends FureProvider {
    /**
     * Anti XSRF token security status.
     */
    readonly state: boolean

    /**
     * An array of scopes that the user granted access to.
     * @link https://developers.google.com/identity/protocols/oauth2/scopes
     */
    readonly scope: string[]

    /**
     * Anti XSRF token manager.
     */
    readonly #uniqueSessionTokenManager: IUniqueSessionTokenManager

    /**
     * Is a storage entity, for store and compare temporal values in different stages,
     * like the unique session token value.
     */
    readonly #store: IStorage

    /**
     * Authentication client for OAuth 2.0 protocol.
     */
    readonly #oAuth2Client: OAuth2Client

    /**
     * Parsed URI, used to redirect the client after authentication is complete.
     */
    protected readonly parsedRedirectUrl: URL

    /**
     * @param {string} provider Authentication provider.
     * @param {string} authenticationUrl Base URL for handle authentication.
     * @param {string} tokenUrl Base URL for token retrieval.
     */
    protected constructor({
        provider
        , tokenUrl
        , authenticationUrl
        , clientId
        , clientSecret
        , redirectUri
        , store = null
        , state
        , scope
    }: OAuth2ProviderOptions) {
        super(provider)
        this.#store = store
        this.state = state
        this.scope = scope
        this.checkState()
        this.checkStorage(this.state)
        this.parsedRedirectUrl = new URL(redirectUri)
        this.#uniqueSessionTokenManager = this.state ? new UniqueSessionTokenManager(this.#store) : null
        this.#oAuth2Client = createOAuth2Client({
            clientId
            , clientSecret
            , tokenUrl
            , authenticationUrl
            , redirectUri
        })
    }

    /**
     * Application ID.
     */
    get clientId() {
        return this.#oAuth2Client.clientId
    }

    /**
     * Application unique secret key.
     */
    get clientSecret() {
        return this.#oAuth2Client.clientSecret
    }

    /**
     * The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     */
    get redirectUri() {
        return this.#oAuth2Client.redirectUri
    }

    /**
     * Base URL for handle authentication.
     */
    get authenticationUrl() {
        return this.#oAuth2Client.authenticationUrl
    }

    /**
    * Base URL for token retrieval.
    */
    get tokenUrl() {
        return this.#oAuth2Client.tokenUrl
    }

    /**
     * Check state property constraints.
     * If state property state is false, store property should not be provided.
     */
    private checkState(): void {
        if (this.state === false && this.#store !== null) {
            throw this.error(500, 'Param status is false', 'If you pass a Storage entity, the state parameter must be true.')
        }
    }

    /**
     * Check store property constraints.
     * If state property is true, an Storage object that implements the IStorage interface must be provided.
     * @param state Anti XSRF token security status.
     */
    private checkStorage(state: boolean): void {
        if (state) {
            if (this.#store === null) {
                throw this.error(500, 'Required Storage entity', 'If the state parameter is true, you must pass a valid storage entity.')
            }
            if (isStore(this.#store)) return
            throw this.error(500, 'Invalid storage entity', 'You must pass a valid storage entity.')
        }
    }

    /**
     * Generate URL for consent page landing.
     * @return URL to consent page.
     */
    protected generateAuthenticationUrl(options: Partial<IGenerateAuthUrlOptions>): string {
        this.checkStorage(options.state)
        let state: string
        if (options.state) {
            state = this.#uniqueSessionTokenManager.create()
            this.#uniqueSessionTokenManager.save(state)
        }
        return this.#oAuth2Client.generateAuthenticationUrl(options, state)
    }

    protected getQueryObjectFromUrl(currentUrl: URL): querystring.ParsedUrlQuery {
        const urlWhioutQuestionMark = currentUrl.search.slice(1)
        return querystring.parse(urlWhioutQuestionMark)
    }

    protected evaluateStateParam(state: string) {
        if (this.#uniqueSessionTokenManager.validate(state)) {
            this.#uniqueSessionTokenManager.remove(state)
            return
        }
        throw this.error(401, 'Wrong state parameter', 'The state parameter is missing or has been altered')
    }

    protected getRequiredParam(id: string, parsedredirectUri: querystring.ParsedUrlQuery): string {
        const param = getRequiredParam(id, parsedredirectUri[id])
        if (param) return param
        throw this.error(500, `Required param ${id}`, `The ${id} param is missing, or it has been altered.`)
    }

    /**
     * Gets token credentials for the given code.
     * @param {GetTokenOptions} options
     * @param options.code Authorization code.
     * @param options.clientId Application ID.
     * @param options.redirectUri The URL that you want to redirect the user logging in back to.
     * @param options.codeVerifier Is a high-entropy cryptographic random string using the unreserved characters.
     */
    protected async getTokens(options: GetTokenOptions) {
        return this.#oAuth2Client.getTokens(options)
    }
}
