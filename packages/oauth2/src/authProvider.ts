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
    readonly provider: string
    /**
     * The client ID for your application. The value passed into the constructor
     * will be used if not provided. You can find this value in the API Console.
     */
    readonly authPath: string
    /**
     * Determines where the API server redirects the user after the user
     * completes the authorization flow. The value must exactly match one of the
     * 'redirect_uri' values listed for your project in the API Console. Note that
     * the http or https scheme, case, and trailing slash ('/') must all match.
     * The value passed into the constructor will be used if not provided.
     */
    readonly state: boolean
    readonly scope: string[]
    readonly authenticationUrl: string
    protected readonly store: IStorage
    protected readonly parsedRedirectUrl: URL
    protected readonly oAuth2Client: OAuth2Client
    protected readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
    protected constructor({
        provider
        , authPath
        , state
        , scope
        , store
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
