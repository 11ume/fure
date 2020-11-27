/* eslint-disable camelcase */
import querystring from 'querystring'
import { IStorage } from 'fure-storage'
import { getRequiredParam, isStore } from 'fure-shared'
import { IUniqueSessionTokenManager } from 'fure-ustm'
import { OAuth2Client, GenerateAuthUrlOptions } from 'fure-oauth2-client'

export type AccessType = 'offline' | 'online'

export interface IGenerateAuthUrlOptions {
    /**
     * @optional
     * @recommended
     * Indicates whether your application can refresh access tokens
     * when the user is not present at the browser. Valid parameter values are
     * 'online', which is the default value, and 'offline'. Set the value to
     * 'offline' if your application needs to refresh access tokens when the user
     * is not present at the browser. This value instructs the Google
     * authorization server to return a refresh token and an access token the
     * first time that your application exchanges an authorization code for
     * tokens.
     */
    access_type?: AccessType

    /**
     * @required
     * Determines whether the response data included when the redirect back to the app occurs is in URL parameters or fragments. See the Confirming Identity section to choose which type your app should use.
     * This can be one of:
     * @type code: Response data is included as URL parameters and contains code parameter (an encrypted string unique to each login request). This is the default behavior if this parameter is not specified.
     * It's most useful when your server will be handling the token.
     * @type token: Response data is included as a URL fragment and contains an access token. Desktop apps must use this setting for response_type. This is most
     * useful when the client will be handling the token.
     * @type code%20token: Response data is included as a URL fragment and contains both an access token and the code parameter.
     * @type granted_scopes: Returns a comma-separated list of all Permissions granted to the app by the user at the time of login. Can be combined with other response_type values. When combined with token, response
     * data is included as a URL fragment, otherwise included as a URL parameter.
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
    readonly authPath: string
    readonly state?: boolean
    readonly scope?: string[]
    readonly store?: IStorage
    readonly oAuth2Client: OAuth2Client
    readonly uniqueSessionTokenManager?: IUniqueSessionTokenManager
}

export class FureOAuth2Provider {
    /**
     * OAuth2 Authentication provider entity.
     * Example: google, twitter, facebook, etc.
     */
    readonly provider: string

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
     * The base endpoints URL for handle authentication.
     */
    readonly authenticationUrl: string

    protected readonly store: IStorage

    /**
     * Parsed URI, used to redirect the client after authentication is complete.
     */
    protected readonly parsedRedirectUrl: URL
    protected readonly oAuth2Client: OAuth2Client
    protected readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
    protected constructor(provider: string, {
        state
        , scope
        , store = null
        , oAuth2Client
        , uniqueSessionTokenManager = null
    }: OAuth2ProviderOptions) {
        this.provider = provider
        this.state = state
        this.scope = scope
        this.store = store
        this.oAuth2Client = oAuth2Client
        this.uniqueSessionTokenManager = uniqueSessionTokenManager
        this.parsedRedirectUrl = new URL(this.oAuth2Client.redirectUri)
        this.state && this.checkStorage()
    }

    private checkStorage(): void {
        if (this.store && isStore(this.store)) return
        throw new Error('Invalid storage, a valid storage object method must be passed')
    }

    protected queryStringParseRedirectUri(currentUrl: URL) {
        const urlWhioutQuestionMark = currentUrl.search.slice(1)
        return querystring.parse(urlWhioutQuestionMark)
    }

    protected handlerRedictUriParamState(parsedredirectUri: querystring.ParsedUrlQuery) {
        const paramState = getRequiredParam('state', parsedredirectUri.state)
        if (this.uniqueSessionTokenManager.valid(paramState)) return
        throw new Error('The state param code is missing, or it has been altered')
    }
}
