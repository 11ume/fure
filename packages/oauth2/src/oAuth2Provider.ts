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
     * Determines where the API server redirects the user after the user
     * completes the authorization flow. The value must exactly match one of the
     * 'redirect_uri' values listed for your project in the API Console. Note that
     * the http or https scheme, case, and trailing slash ('/') must all match.
     * The value passed into the constructor will be used if not provided.
     */
    redirectUri?: string

    /**
     * @required
     * A space-delimited list of scopes that identify the resources that
     * your application could access on the user's behalf. Scopes enable your
     * application to only request access to the resources that it needs while
     * also enabling users to control the amount of access that they grant to your
     * application.
     */
    scope?: string[] | string

    /**
     * @optional
     * @recommended
     * A string value for maintain state between the request and callback.
     * This parameter should be used for preventing Cross-site Request Forgery and will be passed
     * back to you, unchanged, in your redirect URI.
     */
    state?: boolean
}

export interface IFureOAuth2Provider {
    generateAuthUrl(options: Partial<IGenerateAuthUrlOptions>): string
    authenticate(url: string, options?: GetTokenOptions): any
    revokeToken(): any
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
     * Enable state security
     * The state is a opaque string that is round-tripped in the protocol.
     * The state can be useful for correlating requests and responses.
     */
    readonly state: boolean

    /**
     * An array of scopes that the user granted access to.
     * @link https://developers.google.com/identity/protocols/oauth2/scopes
     */
    readonly scope: string[]

    /*
     * An opaque string that is round-tripped in the protocol; that is to say, it is returned as a URI parameter in the Basic flow, and in the URI #fragment
     * identifier in the Implicit flow.
     * The state can be useful for correlating requests and responses.
     * Because your redirect_uri can be guessed, using a state value can increase your assurance that an incoming connection is the result of an authentication request initiated by your app. If you generate a random string or encode the hash of some client state (e.g., a cookie) in this state variable, you can validate the response to additionally ensure that the request and response originated in the same browser. This provides protection against attacks such as cross-site request forgery.
     **/
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
     * Creates an instance of FureOAuth2Provider.
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
        this.#uniqueSessionTokenManager = null
        if (this.state) {
            this.#uniqueSessionTokenManager = new UniqueSessionTokenManager(this.#store)
        }
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
            throw new Error('If you pass a Storage entity, the state parameter must be true')
        }
    }

    /**
     * Check store property constraints.
     * If state property is true, an Storage object that implements the IStorage interface must be provided.
     */
    private checkStorage(state: boolean): void {
        if (state) {
            if (this.#store === null) {
                throw new Error('If the state parameter is true, you must pass a valid storage entity')
            }
            if (isStore(this.#store)) return
            throw new Error('Invalid storage, a valid storage object method must be provided')
        }
    }

    /**
     * Generate URI for consent page landing.
     * @return URI to consent page.
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

    protected evaluateStateParam(parsedredirectUri: querystring.ParsedUrlQuery) {
        const state = this.getRequiredParam('state', parsedredirectUri)
        if (this.#uniqueSessionTokenManager.validate(state)) {
            this.#uniqueSessionTokenManager.remove(state)
            return
        }
        throw this.error(401, 'Wrong state parameter', 'The state parameter is missing or has been altered')
    }

    protected getRequiredParam(id: string, parsedredirectUri: querystring.ParsedUrlQuery): string {
        const param = getRequiredParam(id, parsedredirectUri[id])
        if (param) return param
        throw new Error(`The ${id} param is missing, or it has been altered`)
    }

    /**
     * Gets token credentials for the given code.
     */
    protected async getTokens(options: GetTokenOptions) {
        return this.#oAuth2Client.getTokens(options)
    }
}
