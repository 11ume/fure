import {
    IFureOAuth2Provider
    , IGenerateAuthParams
    , GenerateAuthResult
    , OAuth2ProviderOptions
    , GetTokenOptionsProvider
    , FureOAuth2Provider
    , CodeChallengeMethod
} from 'fure-oauth2'

export enum Prompt {
    none = 'none'
    , consent = 'consent'
    , selectAccount = 'select_account'
}

export enum AccessType {
    online = 'online'
    , offline = 'offline'
}

export enum ResponseType {
    code = 'code'
    , codeToken = 'code_token'
}

interface IGoogleGenerateAuthParams extends IGenerateAuthParams {
    /**
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
    accessType?: AccessType

    /**
     * The hd (hosted domain) parameter streamlines the login process for G Suite
     * hosted accounts. By including the domain of the G Suite user (for example,
     * mycollege.edu), you can indicate that the account selection UI should be
     * optimized for accounts at that domain. To optimize for G Suite accounts
     * generally instead of just one domain, use an asterisk: hd=*.
     * Don't rely on this UI optimization to control who can access your app,
     * as client-side requests can be modified. Be sure to validate that the
     * returned ID token has an hd claim value that matches what you expect
     * (e.g. mycolledge.edu). Unlike the request parameter, the ID token claim is
     * contained within a security token from Google, so the value can be trusted.
     */
    hd?: string

    /**
     * Enables applications to use incremental authorization to request
     * access to additional scopes in context. If you set this parameter's value
     * to true and the authorization request is granted, then the new access token
     * will also cover any scopes to which the user previously granted the
     * application access.
     * See the incremental authorization section.
     * @link https://developers.google.com/identity/protocols/oauth2/web-server#incrementalAuth
     */
    includeGrantedScopes?: boolean

    /**
     * If your application knows which user is trying to authenticate,
     * it can use this parameter to provide a hint to the Google Authentication
     * Server. The server uses the hint to simplify the login flow either by
     * prefilling the email field in the sign-in form or by selecting the
     * appropriate multi-login session. Set the parameter value to an email
     * address or sub identifier, which is equivalent to the user's Google ID.
     */
    loginHint?: string

    /**
     * A space-delimited, case-sensitive list of prompts to present the
     * user. If you don't specify this parameter, the user will be prompted only the first time your app requests access.
     * Possible values are:
     * @value none - Donot display any authentication or consent screens. Must not be specified with other values.
     * @value consent - the user for consent.
     * @value select_account - Prompt the user to select an account.
     */
    prompt?: Prompt

    /**
     * is a random value generated by your app that enables replay protection when present.
     */
    nonce?: boolean
}

export interface GoogleOAuth2ProviderSelfOptions extends OAuth2ProviderOptions {
    readonly nonce?: boolean
    readonly prompt?: Prompt
    readonly accessType?: AccessType
    readonly responseType?: ResponseType
    readonly codeChallengeMethod?: CodeChallengeMethod
    readonly includeGrantedScopes?: boolean
}

export type GoogleOAuth2ProviderOptions = Omit<GoogleOAuth2ProviderSelfOptions,
    'provider'
    | 'tokenUrl'
    | 'authenticationUrl'>

/**
 * Authentication provider.
 */
const PROVIDER = 'google'

/**
 * Base URL for token retrieval.
 */
const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token'

/**
 * Base URL for handle authentication.
 */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export class FureGoogleOAuth2Provider extends FureOAuth2Provider implements IFureOAuth2Provider {
    readonly nonce: boolean
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly responseType: ResponseType
    readonly codeChallengeMethod: CodeChallengeMethod
    readonly includeGrantedScopes: boolean
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , state = false
        , scope = ['openid', 'profile', 'email']
        , nonce = false
        , prompt = undefined
        , accessType = AccessType.offline
        , responseType = ResponseType.code
        , codeChallengeMethod = null
        , includeGrantedScopes = false
    }: GoogleOAuth2ProviderOptions) {
        super({
            provider: PROVIDER
            , tokenUrl: GOOGLE_TOKEN_URL
            , authenticationUrl: GOOGLE_AUTH_URL
            , clientId
            , clientSecret
            , redirectUri
            , state
            , scope
        })

        this.nonce = nonce
        this.prompt = prompt
        this.accessType = accessType
        this.responseType = responseType
        this.codeChallengeMethod = codeChallengeMethod
        this.includeGrantedScopes = includeGrantedScopes
    }

    private checkParamChallange(codeChallengeMethod: string, codeChallenge: string): void {
        if (codeChallengeMethod && !codeChallenge) {
            throw this.error(500, 'Required code_challenge param', 'If a code_challenge_method is provided, code_challenge must be included.')
        }
    }

    private async getTokenOnAuthenticate(code: string, options: GetTokenOptionsProvider) {
        const res = await this.getTokens({
            code
            , ...options
        })

        if (res.error) {
            const { status, message, description } = res.error
            throw this.error(status, message, description)
        }

        return res.credentials
    }

    private prepareAuthParams(options: IGoogleGenerateAuthParams = {}): Partial<IGoogleGenerateAuthParams> {
        const hd = options.hd
        const clientId = this.clientId
        const loginHint = options.loginHint
        const codeChallenge = options.codeChallenge

        const state = options.state ?? this.state
        const scope = options.scope ?? this.scope
        const nonce = options.nonce ?? this.nonce
        const prompt = options.prompt ?? this.prompt
        const accessType = options.accessType ?? this.accessType
        const redirectUri = options.redirectUri ?? this.redirectUri
        const responseType = options.responseType ?? this.responseType
        const codeChallengeMethod = options.codeChallengeMethod ?? this.codeChallengeMethod
        const includeGrantedScopes = options.includeGrantedScopes ?? this.includeGrantedScopes

        const params = {
            hd
            , state
            , scope
            , nonce
            , prompt
            , client_id: clientId
            , login_hint: loginHint
            , access_type: accessType
            , redirect_uri: redirectUri
            , response_type: responseType
            , code_challenge: codeChallenge
            , code_challenge_method: codeChallengeMethod
            , include_granted_scopes: includeGrantedScopes
        }

        this.checkParamChallange(options.codeChallengeMethod, options.codeChallenge)
        return params
    }

    generateAuth(params: IGoogleGenerateAuthParams = {}): GenerateAuthResult {
        const preparedParams = this.prepareAuthParams(params)
        const state = this.generateAuthStateParam(preparedParams.state)
        const nonce = this.generateAuthNonceParam(preparedParams.nonce)
        const url = this.generateAuthenticationUrl(preparedParams, state, nonce)
        return {
            url
            , state
        }
    }

    authenticate(currentUrl: string, options?: GetTokenOptionsProvider) {
        const callbackUrlObj = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentUrl}`)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getRequiredParam('code', callbackUrlQueryObj)
        return this.getTokenOnAuthenticate(code, options)
    }

    revokeToken() {
        return true
    }

    // private getUserInfo() { }
}

