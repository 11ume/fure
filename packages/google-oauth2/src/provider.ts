import querystring from 'querystring'
import {
    IFureOAuth2Provider
    , IGenerateAuthUrlOptions
    , OAuth2ProviderOptions
    , GetTokenOptionsProvider
    , FureOAuth2Provider
    , AccessType
} from 'fure-oauth2'

type Prompt = 'none' | 'consent' | 'select_account'
type ResponseType = 'code' | 'code token'
type CodeChallengeMethod = 'plain' | 'S256'

interface IGoogleGenerateAuthUrlOptions extends IGenerateAuthUrlOptions {
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
    accessType?: AccessType

    /**
     * @optional
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
     * @optional
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
     * @optional
     * If your application knows which user is trying to authenticate,
     * it can use this parameter to provide a hint to the Google Authentication
     * Server. The server uses the hint to simplify the login flow either by
     * prefilling the email field in the sign-in form or by selecting the
     * appropriate multi-login session. Set the parameter value to an email
     * address or sub identifier, which is equivalent to the user's Google ID.
     */
    loginHint?: string

    /**
     * @optional
     * A space-delimited, case-sensitive list of prompts to present the
     * user. If you don't specify this parameter, the user will be prompted only
     * the first time your app requests access.
     * Possible values are:
     * @value none - Donot display any authentication or consent screens. Must not be specified with other values.
     * @value consent - the user for consent.
     * @value select_account - Prompt the user to select an account.
     */
    prompt?: Prompt

    /**
     * @optional
     * @recommended
     * Specifies what method was used to encode a 'code_verifier'
     * that will be used during authorization code exchange. This parameter must
     * be used with the 'code_challenge' parameter. The value of the
     * 'code_challenge_method' defaults to "plain" if not present in the request
     * that includes a 'code_challenge'. The only supported values for this
     * parameter are "S256" or "plain".
     */
    codeChallengeMethod?: CodeChallengeMethod

    /**
     * @optional
     * @recommended
     * Specifies an encoded 'code_verifier' that will be used as a
     * server-side challenge during authorization code exchange. This parameter
     * must be used with the 'code_challenge' parameter described above.
     */
    codeChallenge?: string
}

export interface GoogleOAuth2ProviderSelfOptions extends OAuth2ProviderOptions {
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
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly responseType: ResponseType
    readonly codeChallengeMethod: CodeChallengeMethod
    readonly includeGrantedScopes: boolean
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , store
        , state = false
        , scope = ['openid', 'email', 'profile']
        , prompt = undefined
        , accessType = 'offline'
        , responseType = 'code'
        , codeChallengeMethod = 'S256'
        , includeGrantedScopes = false
    }: Omit<GoogleOAuth2ProviderOptions, 'provider' | 'tokenUrl' | 'authenticationUrl'>) {
        super({
            provider: PROVIDER
            , tokenUrl: GOOGLE_TOKEN_URL
            , authenticationUrl: GOOGLE_AUTH_URL
            , clientId
            , clientSecret
            , redirectUri
            , store
            , state
            , scope
        })

        this.prompt = prompt
        this.accessType = accessType
        this.responseType = responseType
        this.codeChallengeMethod = codeChallengeMethod
        this.includeGrantedScopes = includeGrantedScopes
    }

    private checkParamChallange(codeChallengeMethod: string, codeChallenge: string): void {
        if (codeChallengeMethod && !codeChallenge) {
            throw new Error('If a code_challenge_method is provided, code_challenge must be included.')
        }
    }

    private getParamCode(callbackUrlQueryObj: querystring.ParsedUrlQuery) {
        return this.getRequiredParam('code', callbackUrlQueryObj)
    }

    /**
     * Gets the access token for the given code in the current url.
     * @param code Authorization code.
     * @param options
     * @returns Tokens credentials.
     */
    private async getTokenOnAuthenticate(code: string, options: GetTokenOptionsProvider) {
        const resTokens = await this.getTokens({
            ...options
            , code
        })

        if (resTokens.error) {
            const { status, message, description } = resTokens.error
            throw this.error(status, message, description)
        }

        return resTokens.credentials
    }

    /**
     * Generate URI for consent page landing.
     * @returns URI to consent page.
     */
    generateAuthUrl(options: IGoogleGenerateAuthUrlOptions = {}): string {
        const hd = options.hd
        const clientId = this.clientId
        const loginHint = options.loginHint
        const codeChallenge = options.codeChallenge

        const state = options.state ?? this.state
        const scope = options.scope ?? this.scope
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
        return this.generateAuthenticationUrl(params)
    }

    /**
    * Method used for parse the returned URL after an succes authentication in the consent page,
    * then a request is made with part of the parameters extracted from that URL.
    * @param currentUrl Is current request url, is usually obtained through the property url of Request object.
    * @param options
    * @return Authentication credentials and authenticated user information, this can varies depending of the "scope" parameter.
    */
    authenticate(currentUrl: string, options?: GetTokenOptionsProvider) {
        const callbackUrlObj = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentUrl}`)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getParamCode(callbackUrlQueryObj)
        if (this.state) this.evaluateStateParam(callbackUrlQueryObj)
        return this.getTokenOnAuthenticate(code, options)
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }

    // private getUserInfo() { }
}

