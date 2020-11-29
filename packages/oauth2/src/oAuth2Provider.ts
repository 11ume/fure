import querystring from 'querystring'
import { FureProvider } from 'fure-provider'
import { IStorage, isStore } from 'fure-storage'
import { getRequiredParam } from 'fure-shared'
import { UniqueSessionTokenManager, IUniqueSessionTokenManager } from 'fure-ustm'
import { OAuth2Client, GenerateAuthUrlOptions } from 'fure-oauth2-client'

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
     * A string value created by your app to maintain state between the request and callback.
     * This parameter should be used for preventing Cross-site Request Forgery and will be passed
     * back to you, unchanged, in your redirect URI.
     */
    state?: string
}

export interface IFureOAuth2Provider {
    generateAuthUrl(options: GenerateAuthUrlOptions): string
    callbackHandler(): any
    revokeToken(): any
}

export interface OAuth2ProviderOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly state?: boolean
    readonly scope?: string[]
    readonly store?: IStorage
}

export class FureOAuth2Provider extends FureProvider {
    /**
     * An opaque string that is round-tripped in the protocol.
     * The state can be useful for correlating requests and responses.
     */
    readonly state: boolean

    /**
     * An array of scopes that the user granted access to.
     * @link https://developers.google.com/identity/protocols/oauth2/scopes
     */
    readonly scope: string[]

    /**
     * Is a storage entity, for store and compare temporal values in different stages,
     * like the unique session token value.
     */
    readonly #store: IStorage

    /**
     * Parsed URI, used to redirect the client after authentication is complete.
     */
    // readonly #parsedRedirectUrl: URL

    /*
     * An opaque string that is round-tripped in the protocol; that is to say, it is returned as a URI parameter in the Basic flow, and in the URI #fragment
     * identifier in the Implicit flow.
     * The state can be useful for correlating requests and responses.
     * Because your redirect_uri can be guessed, using a state value can increase your assurance that an incoming connection is the result of an authentication request initiated by your app. If you generate a random string or encode the hash of some client state (e.g., a cookie) in this state variable, you can validate the response to additionally ensure that the request and response originated in the same browser. This provides protection against attacks such as cross-site request forgery.
     **/
    readonly #uniqueSessionTokenManager: IUniqueSessionTokenManager = null

    /**
     * Authentication client for OAuth 2.0 protocol.
     */
    readonly #oAuth2Client: OAuth2Client

    protected constructor(provider: string, authenticationUrl: string, tokenUrl: string, {
        clientId
        , clientSecret
        , redirectUri
        , state
        , scope
        , store = null
    }: OAuth2ProviderOptions) {
        super(provider)
        this.state = state
        this.scope = scope
        this.#store = store
        this.checkState()
        this.checkStorage()
        // this.#parsedRedirectUrl = new URL(this.#oAuth2Client.redirectUri)
        this.#uniqueSessionTokenManager = new UniqueSessionTokenManager(this.#store, this.state)
        this.#oAuth2Client = new OAuth2Client({
            clientId
            , clientSecret
            , redirectUri
            , tokenUrl
            , authenticationUrl
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
     * URL used for create an authorization request link.
     */
    get authenticationUrl() {
        return this.#oAuth2Client.authenticationUrl
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
    private checkStorage(): void {
        if (this.state) {
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
    protected generateAuthenticationUrl(options: GenerateAuthUrlOptions): string {
        return this.#oAuth2Client.generateAuthenticationUrl(options)
    }

    protected redirectUriToObject(currentUrl: URL): querystring.ParsedUrlQuery {
        const urlWhioutQuestionMark = currentUrl.search.slice(1)
        return querystring.parse(urlWhioutQuestionMark)
    }

    protected evaluateStateParam(param: string) {
        return this.#uniqueSessionTokenManager.valid(param)
    }

    protected getRequiredParam(id: string, parsedredirectUri: querystring.ParsedUrlQuery): void {
        const param = getRequiredParam(id, parsedredirectUri.state)
        if (param) return
        throw new Error(`The ${id} param is missing, or it has been altered`)
    }
}
