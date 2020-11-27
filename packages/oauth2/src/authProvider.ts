import querystring from 'querystring'
import { IStorage } from 'fure-storage'
import { getRequiredParam, isStore } from 'fure-shared'
import { IUniqueSessionTokenManager } from 'fure-ustm'
import { OAuth2Client } from 'fure-oauth2-client'

export interface IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    generateAuthUrl(): string
    callbackHandler(): any
    revokeToken(): any
}

export interface IFureOAuth2Provider {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    generateAuthUrl(): string
    callbackHandler(): any
    revokeToken(): any
}

export interface OAuth2ProviderOptions {
    readonly provider: string
    readonly clientId: string
    readonly clientSecret: string
    readonly authenticationUrl: string
    readonly authPath: string
    readonly redirectUri: string
    readonly state?: boolean
    readonly scope?: string[]
    readonly store?: IStorage
    readonly oAuth2Client: OAuth2Client
    readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
}

export class FureOAuth2Provider {
    readonly provider: string
    readonly clientId: string
    readonly clientSecret: string
    readonly authPath: string
    readonly redirectUri: string
    readonly state: boolean
    readonly scope: string[]
    readonly authenticationUrl: string
    protected readonly store: IStorage
    protected readonly parsedRedirectUrl: URL
    protected readonly oAuth2Client: OAuth2Client
    protected readonly uniqueSessionTokenManager: IUniqueSessionTokenManager
    protected constructor({
        provider
        , clientId
        , clientSecret
        , authenticationUrl
        , authPath
        , redirectUri
        , state
        , scope
        , store
        , oAuth2Client
        , uniqueSessionTokenManager
    }: OAuth2ProviderOptions) {
        this.provider = provider
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.authenticationUrl = authenticationUrl
        this.authPath = authPath
        this.redirectUri = redirectUri
        this.state = state
        this.scope = scope
        this.store = store
        this.oAuth2Client = oAuth2Client
        this.uniqueSessionTokenManager = uniqueSessionTokenManager
        this.parsedRedirectUrl = new URL(this.redirectUri)
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
