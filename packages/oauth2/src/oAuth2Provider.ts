/* eslint-disable camelcase */
import querystring from 'querystring'
import { FureProvider } from 'fure-provider'
import { IStorage } from 'fure-storage'
import { getRequiredParam, isStore } from 'fure-shared'
import { IUniqueSessionTokenManager } from 'fure-ustm'
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
    response_type?: string

    /**
     * @required
     * Determines where the API server redirects the user after the user
     * completes the authorization flow. The value must exactly match one of the
     * 'redirect_uri' values listed for your project in the API Console. Note that
     * the http or https scheme, case, and trailing slash ('/') must all match.
     * The value passed into the constructor will be used if not provided.
     */
    redirect_uri?: string

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
    readonly state?: boolean
    readonly scope?: string[]
    readonly store?: IStorage
    readonly oAuth2Client: OAuth2Client
    readonly uniqueSessionTokenManager?: IUniqueSessionTokenManager
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
    protected readonly store: IStorage

    /**
     * Parsed URI, used to redirect the client after authentication is complete.
     */
    protected readonly parsedRedirectUrl: URL

    /*
     * An opaque string that is round-tripped in the protocol; that is to say, it is returned as a URI parameter in the Basic flow, and in the URI #fragment
     * identifier in the Implicit flow.
     * The state can be useful for correlating requests and responses.
     * Because your redirect_uri can be guessed, using a state value can increase your assurance that an incoming connection is the result of an authentication request initiated by your app. If you generate a random string or encode the hash of some client state (e.g., a cookie) in this state variable, you can validate the response to additionally ensure that the request and response originated in the same browser. This provides protection against attacks such as cross-site request forgery.
     **/
    protected readonly uniqueSessionTokenManager: IUniqueSessionTokenManager

    /**
     * Authentication client for OAuth 2.0 protocol.
     */
    readonly #oAuth2Client: OAuth2Client

    protected constructor(provider: string, {
        state
        , scope
        , store = null
        , oAuth2Client
        , uniqueSessionTokenManager = null
    }: OAuth2ProviderOptions) {
        super(provider)
        this.state = state
        this.scope = scope
        this.store = store
        this.uniqueSessionTokenManager = uniqueSessionTokenManager
        this.#oAuth2Client = oAuth2Client
        this.parsedRedirectUrl = new URL(this.#oAuth2Client.redirectUri)
        this.checkState()
        this.checkStorage()
    }

    /**
    * Your application ID.
    */
    get clientId(): string {
        return this.#oAuth2Client.clientId
    }

    /**
     * The base endpoints URL for handle authentication.
     */
    get authenticationUrl(): string {
        return this.#oAuth2Client.authenticationUrl
    }

    /**
     *  The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     */
    get redirectUri(): string {
        return this.#oAuth2Client.redirectUri
    }

    /**
     *  Check state property constraints.
     *  If state property state is false, store property should not be provided.
     */
    private checkState(): void {
        if (this.state === false && this.store !== null) {
            throw new Error('If you pass a Storage entity, the state parameter must be true')
        }
    }

    /**
     *  Check store property constraints.
     *  If state property is true, an Storage object that implements the IStorage interface must be provided.
     */
    private checkStorage(): void {
        if (this.state) {
            if (this.store === null) {
                throw new Error('If the state parameter is true, you must pass a valid storage entity')
            }
            if (isStore(this.store)) return
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

    protected handlerRedictUriParamState(parsedredirectUri: querystring.ParsedUrlQuery): void {
        const paramState = getRequiredParam('state', parsedredirectUri.state)
        if (this.uniqueSessionTokenManager.valid(paramState)) return
        throw new Error('The state param code is missing, or it has been altered')
    }
}
