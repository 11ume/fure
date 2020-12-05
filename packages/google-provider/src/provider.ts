/* eslint-disable camelcase */
import querystring from 'querystring'
import { TokenRequestValues, TokenCredentials, TokenCredentialsError } from './credentials'
import { deleteFalsyValues } from 'fure-shared'
import { Response } from 'node-fetch'
import {
    IFureOAuth2Provider
    , IGenerateAuthOptions
    , GenerateAuthResult
    , OAuth2ProviderOptions
    , GetTokenOptions
    , FureOAuth2Provider
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

export enum CodeChallengeMethod {
    S256 = 'S256'
}

export interface GoogleOAuth2ProviderSelfOptions extends OAuth2ProviderOptions {
    readonly hd?: string
    readonly prompt?: Prompt
    readonly accessType?: AccessType
    readonly responseType?: ResponseType
    readonly codeChallenge?: boolean
    readonly codeChallengeMethod?: CodeChallengeMethod
    readonly includeGrantedScopes?: boolean
}

export type GoogleOAuth2ProviderOptions = Omit<GoogleOAuth2ProviderSelfOptions,
    'provider'
    | 'tokenUrl'
    | 'authenticationUrl'>

enum GrantTypes {
    authorizationCode = 'authorization_code'
}

interface IGoogleGenerateAuthOptions extends IGenerateAuthOptions {
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
    access_type?: AccessType

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
    include_granted_scopes?: boolean

    /**
     * If your application knows which user is trying to authenticate,
     * it can use this parameter to provide a hint to the Google Authentication
     * Server. The server uses the hint to simplify the login flow either by
     * prefilling the email field in the sign-in form or by selecting the
     * appropriate multi-login session. Set the parameter value to an email
     * address or sub identifier, which is equivalent to the user's Google ID.
     */
    login_hint?: string

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
     * @recommended
     * Specifies what method was used to encode a 'code_verifier'
     * that will be used during authorization code exchange. This parameter must
     * be used with the 'code_challenge' parameter. The value of the
     * 'code_challenge_method' defaults to "plain" if not present in the request
     * that includes a 'code_challenge'. The only supported values for this
     * parameter are "S256" or "plain".
     */
    code_challenge_method?: CodeChallengeMethod

    /**
     * @recommended
     * Specifies an encoded 'code_verifier' that will be used as a
     * server-side challenge during authorization code exchange. This parameter
     * must be used with the 'code_challenge' parameter described above.
     */
    code_challenge?: boolean
}

type AuthTokenResponse = TokenCredentials & TokenCredentialsError

type ResponseError = {
    status: number
    message: string
    description: string
}

type GetTokenResponse = {
    error: ResponseError
    credentials: Partial<TokenCredentials>
}

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

/**
 * A space-delimited list of scopes that identify the resources that your application
 * could access on the user's behalf. Scopes enable your application to only request access
 * to the resources that it needs while also enabling users to control the amount of access that
 * they grant to your application.
 */
const GOOGOLE_SCOPE = ['openid', 'profile', 'email']

export class FureGoogleOAuth2Provider extends FureOAuth2Provider implements IFureOAuth2Provider {
    readonly hd: string
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly responseType: ResponseType
    readonly codeChallenge: boolean
    readonly codeChallengeMethod: CodeChallengeMethod
    readonly includeGrantedScopes: boolean
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , state = false
        , scope = GOOGOLE_SCOPE
        , hd = null
        , prompt = null
        , accessType = AccessType.offline
        , responseType = ResponseType.code
        , codeChallenge = false
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

        this.hd = hd
        this.prompt = prompt
        this.accessType = accessType
        this.responseType = responseType
        this.codeChallenge = codeChallenge
        this.codeChallengeMethod = codeChallengeMethod
        this.includeGrantedScopes = includeGrantedScopes
    }

    generateAuth(params: IGoogleGenerateAuthOptions = {}): GenerateAuthResult {
        const preparedParams = this.prepareAuthParams(params)
        const state = this.generateAuthStateParam(preparedParams.state)
        const { codeVerifier, codeChallenge } = this.generatePkce(preparedParams.code_challenge)
        const url = this.generateAuthenticationUrl(preparedParams, state, codeChallenge)

        return {
            url
            , state
            , codeVerifier
            , codeChallenge
        }
    }

    authenticate(currentUrl: string, options?: GetTokenOptions) {
        const callbackUrlObj = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentUrl}`)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getRequiredParam('code', callbackUrlQueryObj)
        return this.getTokenOnAuthenticate(code, options)
    }

    revokeToken() {
        return true
    }

    private async getTokenOnAuthenticate(code: string, options: GetTokenOptions) {
        const res = await this.getTokens(code, options)
        if (res.error) {
            const { status, message, description } = res.error
            throw this.error(status, message, description)
        }

        return res.credentials
    }

    private prepareAuthParams(options: IGoogleGenerateAuthOptions = {}): Partial<IGoogleGenerateAuthOptions> {
        const {
            hd = this.hd
            , state = this.state
            , scope = this.scope
            , prompt = this.prompt
            , client_id = this.clientId
            , login_hint
            , access_type = this.accessType
            , redirect_uri = this.redirectUri
            , response_type = this.responseType
            , code_challenge = this.codeChallenge
            , code_challenge_method = this.codeChallengeMethod
            , include_granted_scopes = this.includeGrantedScopes
        } = options

        return {
            hd
            , state
            , scope
            , prompt
            , client_id
            , login_hint
            , access_type
            , redirect_uri
            , response_type
            , code_challenge
            , code_challenge_method
            , include_granted_scopes
        }
    }

    private async getTokens(code: string, {
        clientId
        , redirectUri
        , codeVerifier
    }: GetTokenOptions = {}): Promise<GetTokenResponse> {
        const values = {
            code
            , grant_type: GrantTypes.authorizationCode
            , code_verifier: codeVerifier
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
        }

        const cleanedValues = deleteFalsyValues(values)
        const res = await this.makeGetTokenRequest(cleanedValues)
        return this.handleGetTokenResponse(res)
    }

    private async handleGetTokenResponse(res: Response): Promise<GetTokenResponse> {
        const body: AuthTokenResponse = await res.json()
        if (res.ok) {
            return {
                error: null
                , credentials: body
            }
        }

        const status = res.status
        const message = body.error ?? 'Get token response error.'
        const description = body.error_description ?? 'No description.'
        return {
            credentials: null
            , error: {
                status
                , message
                , description
            }
        }
    }

    private makeGetTokenRequest(values: Partial<TokenRequestValues>): Promise<Response> {
        const body = querystring.stringify(values)
        return this.fetch(this.tokenUrl, {
            body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}

