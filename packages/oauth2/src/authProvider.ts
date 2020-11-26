import querystring from 'querystring'
import { IStorage } from 'fure-storage'
import { getRequiredParam, isStore } from 'fure-shared'
import { IUniqueSessionTokenManager } from 'fure-ustm'
import { IOAuth2Client } from 'fure-oauth2-client'

export interface OAuth2ProviderOptions {
    readonly provider: string
    readonly clientId: string
    readonly clientSecret: string
    readonly authPath: string
    readonly redirectUri: string
    readonly state?: boolean
    readonly store?: IStorage
    readonly scope?: string[]
    readonly oAuth2Client: IOAuth2Client
    readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
}

export class FureOAuth2Provider {
    readonly provider: string
    readonly clientId: string
    readonly clientSecret: string
    readonly authPath: string
    readonly redirectUri: string
    readonly scope: string[]
    readonly state: boolean
    protected readonly store: IStorage
    protected readonly parsedRedirectUrl: URL
    protected readonly oAuth2Client: IOAuth2Client
    protected readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
    protected constructor({
        provider
        , clientId
        , clientSecret
        , authPath
        , redirectUri
        , scope
        , state
        , store
        , oAuth2Client
        , uniqueSessionTokenManager
    }: OAuth2ProviderOptions) {
        this.provider = provider
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.authPath = authPath
        this.redirectUri = redirectUri
        this.scope = scope
        this.state = state
        this.store = store
        this.parsedRedirectUrl = new URL(this.redirectUri)
        this.oAuth2Client = oAuth2Client
        this.uniqueSessionTokenManager = uniqueSessionTokenManager
        this.checkStorage()
    }

    private checkStorage(): void {
        if (this.state && this.store && isStore(this.store)) return
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
