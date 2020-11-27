import querystring from 'querystring'
import { IStorage } from 'fure-storage'
import { getRequiredParam, isStore } from 'fure-shared'
import { IUniqueSessionTokenManager } from 'fure-ustm'
import { OAuth2Client, GenerateAuthUrlOptions } from 'fure-oauth2-client'

export interface IFureOAuth2Provider {
    generateAuthUrl(options: GenerateAuthUrlOptions): string
    callbackHandler(): any
    revokeToken(): any
}

export interface OAuth2ProviderOptions {
    readonly provider: string
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

    readonly authPath: string

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
     * The URI to redirect to after completing the authentication, but parse for URI constructor.
     */
    protected readonly parsedRedirectUrl: URL

    protected readonly oAuth2Client: OAuth2Client
    protected readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
    protected constructor({
        provider
        , authPath
        , state
        , scope
        , store = null
        , oAuth2Client
        , uniqueSessionTokenManager = null
    }: OAuth2ProviderOptions) {
        this.provider = provider
        this.authPath = authPath
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
