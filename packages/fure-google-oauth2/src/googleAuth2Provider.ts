import { IncomingMessage } from 'http'
import { FureOAuth2Provider, OAuth2ProviderOptions } from 'fure-oauth2'
import createGoogleOAutoOpenIDApi, { AccessType, Prompt, GoogleOAutoOpenIDApi } from './googleOpenIDApi'

// https://developers.google.com/identity/protocols/oauth2/scopes
const DEFAULT_SCOPES = ['openid', 'email', 'profile']

export interface GoogleOAuth2ProviderOptions extends OAuth2ProviderOptions {
    readonly prompt?: Prompt
    readonly accessType?: AccessType
}

export class FureGoogleOAuth2Provider extends FureOAuth2Provider {
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly #googleOAutoOpenIDApi: GoogleOAutoOpenIDApi
    constructor({
        clientId
        , clientSecret
        , authPath
        , redirectUri
        , scope = DEFAULT_SCOPES
        , state = false
        , store = null
        , prompt = null
        , accessType = 'offline'
        , oAuth2Client
        , uniqueSessionTokenManager
    }: Omit<GoogleOAuth2ProviderOptions, 'provider'>) {
        super({
            provider: 'google'
            , clientId
            , clientSecret
            , authPath
            , redirectUri
            , scope
            , state
            , store
            , oAuth2Client
            , uniqueSessionTokenManager
        })
        this.prompt = prompt
        this.accessType = accessType
        this.#googleOAutoOpenIDApi = createGoogleOAutoOpenIDApi({
            oAuth2Client: this.oAuth2Client
            , uniqueSessionTokenManager: this.uniqueSessionTokenManager
            , accessType: this.accessType
            , prompt: this.prompt
            , scope: this.scope
        })
    }

    /**
     * Generate redirection URI for consent page landing.
     * @return URI to consent page.
     */
    createAuthUrl() {
        return this.#googleOAutoOpenIDApi.createAuthUrl()
    }

    /**
     * Method used for parse the returned URI after an succes authentication in the consent page,
     * then a request is made with part of the parameters extracted from the returned URI.
     * @return user information, this can varies depending of the "scope" parameter.
     */
    callbackHandler(req: IncomingMessage) {
        const currentUrl = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${req.url}`)
        const parsedRedirectUri = this.queryStringParseRedirectUri(currentUrl)
        if (this.uniqueSessionTokenManager.enabled) {
            this.handlerRedictUriParamState(parsedRedirectUri)
        }

        return this.#googleOAutoOpenIDApi.getUserInfo(parsedRedirectUri)
    }

    revokeToken(accessToken: string) {
        return this.#googleOAutoOpenIDApi.revokeToken(accessToken)
    }
}

