import querystring from 'querystring'
import { FureProvider } from 'fure-provider'
import { IStorage, isStore } from 'fure-storage'
import { getRequiredParam } from 'fure-shared'
import { UniqueSessionTokenManager, IUniqueSessionTokenManager } from 'fure-ustm'
import createOAuth2Client, { OAuth2Client, GetTokenOptions } from 'fure-oauth2-client'
export interface IGenerateOAuthUrlOptions {
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
    generateAuthUrl(options: Partial<IGenerateOAuthUrlOptions>): string
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
    readonly state: boolean
    readonly scope: string[]
    readonly #store: IStorage
    readonly #oAuth2Client: OAuth2Client
    readonly #uniqueSessionTokenManager: IUniqueSessionTokenManager
    protected readonly parsedRedirectUrl: URL
    protected constructor({
        provider
        , tokenUrl
        , authenticationUrl
        , clientId
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
        this.#oAuth2Client = createOAuth2Client({
            clientId
            , clientSecret
            , tokenUrl
            , authenticationUrl
            , redirectUri
        })
        this.#uniqueSessionTokenManager = this.state ? new UniqueSessionTokenManager(this.#store) : null
        this.parsedRedirectUrl = new URL(redirectUri)
        this.checkState()
        this.checkStorage(this.state)
    }

    get clientId() {
        return this.#oAuth2Client.clientId
    }

    get clientSecret() {
        return this.#oAuth2Client.clientSecret
    }

    get redirectUri() {
        return this.#oAuth2Client.redirectUri
    }

    get authenticationUrl() {
        return this.#oAuth2Client.authenticationUrl
    }

    get tokenUrl() {
        return this.#oAuth2Client.tokenUrl
    }

    private checkState(): void {
        if (this.state === false && this.#store !== null) {
            throw this.error(500, 'Param status is false', 'If you pass a Storage entity, the state parameter must be true.')
        }
    }

    private checkStorage(state: boolean): void {
        if (state) {
            if (this.#store === null) {
                throw this.error(500, 'Required Storage entity', 'If the state parameter is true, you must pass a valid storage entity.')
            }
            if (isStore(this.#store)) return
            throw this.error(500, 'Invalid storage entity', 'You must pass a valid storage entity.')
        }
    }

    protected generateAuthenticationUrl(options: Partial<IGenerateOAuthUrlOptions>): string {
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

    protected async getTokens(options: GetTokenOptions) {
        return this.#oAuth2Client.getTokens(options)
    }
}
