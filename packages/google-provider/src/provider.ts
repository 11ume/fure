import querystring from 'querystring'
import {
    IFureOAuth2Provider
    , IAuthenticateOptions
    , ITokenGetOptions
    , ITokenCredentials
    , ITokenGetTokenParams
    , ITokenRefreshParams
    , IGenerateAuthResult
    , IOAuth2ProviderOptions
    , FureOAuth2Provider
} from 'fure-oauth2'
import {
    Prompt
    , AccessType
    , ResponseType
    , CodeChallengeMethod
    , IGoogleGenerateAuthUrlOptions
    , IGoogleGenerateAuthUrlParams
} from './options'
import { IProfileOptions, IProfileResponse } from './profile'

export interface IGoogleOAuth2ProviderOptions extends IOAuth2ProviderOptions {
    readonly hd?: string
    readonly prompt?: Prompt
    readonly accessType?: AccessType
    readonly responseType?: ResponseType
    readonly codeChallenge?: boolean
    readonly codeChallengeMethod?: CodeChallengeMethod
    readonly includeGrantedScopes?: boolean
    readonly tokenRefreshAnticipationTime?: number
}

interface IGenerateGoogleAuthResult extends IGenerateAuthResult {
    codeVerifier?: string | null
    codeChallenge?: string | null
}

interface ITokensCredentialsExtended extends ITokenCredentials {
    expiry_date: number
}

enum GrantTypes {
    authorizationCode = 'authorization_code'
    , refreshToken = 'refresh_token'
}

/**
 * Relevant information
 * OpenID Google .well-known
 * @link https://accounts.google.com/.well-known/openid-configuration
 * Using OAuth 2.0 for Web Server Applications
 * @link https://developers.google.com/identity/protocols/oauth2/web-server
 */

/** Authentication provider. */
const PROVIDER = 'google'

/**
 * Default list of scopes that identify the resources that your application
 * could access on the user's behalf.
 */
const GOOGOLE_SCOPE = ['openid', 'profile', 'email']

/** Base URL for token retrieval. */
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/** The base endpoint to revoke tokens. */
const GOOGLE_REVOKE_TOKEN_URL = 'https://oauth2.googleapis.com/revoke'

/** Base URL for redirect to Google's authorization server. */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

/** Base URL for obtain user information of some access token. */
const GOOGLE_USER_INFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

/** Anticipation time before expiration of an authentication access token */
const TOKEN_REFRESH_ANTICIPATION_TIME = 60 * 5 // Five seconds

export class FureGoogleOAuth2Provider extends FureOAuth2Provider
    implements IFureOAuth2Provider<ITokensCredentialsExtended> {
    readonly hd: string
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly responseType: ResponseType
    readonly codeChallenge: boolean
    readonly codeChallengeMethod: CodeChallengeMethod
    readonly includeGrantedScopes: boolean
    readonly tokenRefreshAnticipationTime: number
    readonly userInfoUrl = GOOGLE_USER_INFO_URL
    readonly revokeTokenUrl = GOOGLE_REVOKE_TOKEN_URL
    constructor({
        clientId
        , clientSecret
        , redirectUri
        , state = true
        , scope = GOOGOLE_SCOPE
        , hd = null
        , prompt = null
        , accessType = AccessType.offline
        , responseType = ResponseType.code
        , codeChallenge = false
        , codeChallengeMethod = null
        , includeGrantedScopes = false
        , tokenRefreshAnticipationTime = TOKEN_REFRESH_ANTICIPATION_TIME
    }: IGoogleOAuth2ProviderOptions) {
        super({
            provider: PROVIDER
            , tokenUrl: GOOGLE_TOKEN_URL
            , authenticationUrl: GOOGLE_AUTH_URL
        }, {
            clientId
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
        this.tokenRefreshAnticipationTime = tokenRefreshAnticipationTime
    }

    public authGenerateUrl(options: IGoogleGenerateAuthUrlOptions = {}): IGenerateGoogleAuthResult {
        const params = this.prepareAuthParams(options)
        const state = this.generateAuthStateParam(params.state)
        const { codeVerifier, codeChallenge } = this.generatePkce(params.code_challenge)
        const url = this.generateAuthenticationUrl(params, state, codeChallenge)
        return {
            url
            , state
            , codeVerifier
            , codeChallenge
        }
    }

    public async auth(currentPath: string, options?: IAuthenticateOptions): Promise<ITokensCredentialsExtended> {
        const currentUrl = `${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentPath}`
        const callbackUrlObj = new URL(currentUrl)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getRequiredParam('code', callbackUrlQueryObj)
        const tokenCredentials = await this.getTokensCredentials(code, options?.token)
        return this.addExpiryDateToToken(tokenCredentials)
    }

    public async authRefresh(refreshToken: string, expiryDate: number): Promise<ITokenCredentials> {
        if (this.checkTokenExpiryDate(expiryDate)) return this.refreshToken(refreshToken)
        return null
    }

    public async getProfile(options: Partial<IProfileOptions>): Promise<IProfileResponse> {
        const url = this.userInfoUrl
        const params = {
            alt: 'json'
            , ...options
        }
        const body = querystring.stringify(params)
        const res = await this.request({
            url
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const value: IProfileResponse = await res.json()
        const errorMessage = 'In request for get user info.'
        return this.response<IProfileResponse>(res, {
            value
            , errorMessage
        })
    }

    public async revokeToken(accessToken: string): Promise<unknown> {
        const url = this.revokeTokenUrl
        const body = querystring.stringify({
            token: accessToken
        })

        const res = await this.request({
            url
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const value = await res.json()
        const errorMessage = 'In request for revoke authentication access token.'
        return this.response(res, {
            value
            , errorMessage
        })
    }

    protected async getTokensCredentials(code: string, options: ITokenGetOptions = {}): Promise<ITokenCredentials> {
        const { clientId, redirectUri, codeVerifier } = options
        const url = this.tokenUrl
        const params: Partial<ITokenGetTokenParams> = {
            code
            , grant_type: GrantTypes.authorizationCode
            , code_verifier: codeVerifier
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
        }

        const body = querystring.stringify(params)
        const res = await this.request({
            url
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const value: ITokenCredentials = await res.json()
        const errorMessage = 'In request for get access tokens.'
        return this.response<ITokenCredentials>(res, {
            value
            , errorMessage
        })
    }

    protected async refreshToken(refreshToken: string, clientId?: string): Promise<ITokenCredentials> {
        const url = this.tokenUrl
        const params: Partial<ITokenRefreshParams> = {
            grant_type: GrantTypes.refreshToken
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , refresh_token: refreshToken
        }

        const body = querystring.stringify(params)
        const res = await this.request({
            url
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const value: ITokenCredentials = await res.json()
        const errorMessage = 'In request for refresh access tokens.'
        return this.response(res, {
            value
            , errorMessage
        })
    }

    protected checkTokenExpiryDate(tokenExpiryDate: number, anticipationTime?: number): boolean {
        const seconds = anticipationTime ?? this.tokenRefreshAnticipationTime
        const currentTimeInSeconds = (new Date().getTime() / 1000) - seconds
        return tokenExpiryDate <= currentTimeInSeconds
    }

    protected addExpiryDateToToken(tokenCredentials: ITokenCredentials): ITokensCredentialsExtended {
        const expiryDate = (new Date().getTime() / 1000) + tokenCredentials.expires_in
        return {
            ...tokenCredentials
            , expiry_date: expiryDate
        }
    }

    private prepareAuthParams(options: IGoogleGenerateAuthUrlOptions = {}): Partial<IGoogleGenerateAuthUrlParams> {
        const params: IGoogleGenerateAuthUrlParams = {
            hd: options.hd ?? this.hd
            , state: options.state ?? this.state
            , scope: options.scope ?? this.scope
            , prompt: options.prompt ?? this.prompt
            , client_id: options.clientId ?? this.clientId
            , login_hint: options.loginHint
            , access_type: options.accessType ?? this.accessType
            , redirect_uri: options.redirectUri ?? this.redirectUri
            , response_type: options.responseType ?? this.responseType
            , code_challenge: options.codeChallenge ?? this.codeChallenge
            , code_challenge_method: options.codeChallengeMethod ?? this.codeChallengeMethod
            , include_granted_scopes: options.includeGrantedScopes ?? this.includeGrantedScopes
        }

        return params
    }
}

