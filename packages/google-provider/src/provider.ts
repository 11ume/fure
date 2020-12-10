import querystring from 'querystring'
import {
    IFureOAuth2Provider
    , IGetTokenOptions
    , IAuthenticateOptions
    , ITokensCredentials
    , ITokensRequestParams
    , IGenerateAuthResult
    , IOAuth2ProviderOptions
    , FureOAuth2Provider
} from 'fure-oauth2'
import {
    IGoogleGenerateAuthOptions
    , Prompt
    , AccessType
    , ResponseType
    , CodeChallengeMethod
} from './options'
import { IProfileParams, IProfileResponse } from './profile'

export interface IGoogleOAuth2ProviderSelfOptions extends IOAuth2ProviderOptions {
    readonly hd?: string
    readonly prompt?: Prompt
    readonly accessType?: AccessType
    readonly responseType?: ResponseType
    readonly codeChallenge?: boolean
    readonly codeChallengeMethod?: CodeChallengeMethod
    readonly includeGrantedScopes?: boolean
}

export type GoogleOAuth2ProviderOptions = Omit<IGoogleOAuth2ProviderSelfOptions,
    'provider'
    | 'tokenUrl'
    | 'authenticationUrl'>

interface IGenerateGoogleAuthResult extends IGenerateAuthResult {
    codeVerifier?: string | null
    codeChallenge?: string | null
}

interface ITokensCredentialsFinal extends ITokensCredentials {
    expiry_date: number
}

enum GrantTypes {
    authorizationCode = 'authorization_code'
    , refreshToken = 'refresh_token'
}

/**
 * OpenID Google .well-known
 * @link https://accounts.google.com/.well-known/openid-configuration
 */

/**
 * Authentication provider.
 */
const PROVIDER = 'google'

/**
 * Base URL for token retrieval.
 */
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/**
 * The base endpoint to revoke tokens.
 */
const GOOGLE_REVOKE_TOKEN_URL = 'https://oauth2.googleapis.com/revoke'

/**
 * Base URL for handle authentication.
 */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

/**
 * Base URL for obtain user information of some access token.
 */
const GOOGLE_USER_INFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

/**
 * Default list of scopes that identify the resources that your application
 * could access on the user's behalf.
 */
const GOOGOLE_SCOPE = ['openid', 'profile', 'email']

export class FureGoogleOAuth2Provider extends FureOAuth2Provider implements IFureOAuth2Provider<ITokensCredentialsFinal> {
    readonly hd: string
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly responseType: ResponseType
    readonly codeChallenge: boolean
    readonly codeChallengeMethod: CodeChallengeMethod
    readonly includeGrantedScopes: boolean
    readonly userInfoUrl: string
    readonly revokeTokenUrl: string
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
        this.userInfoUrl = GOOGLE_USER_INFO_URL
        this.revokeTokenUrl = GOOGLE_REVOKE_TOKEN_URL
    }

    public authGenerateUrl(params: IGoogleGenerateAuthOptions = {}): IGenerateGoogleAuthResult {
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

    public async auth(currentUrl: string, options?: IAuthenticateOptions): Promise<ITokensCredentialsFinal> {
        const callbackUrlObj = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentUrl}`)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getRequiredParam('code', callbackUrlQueryObj)
        const tokenCredentials = await this.getTokensCredentials(code, options?.token)
        return this.addTokenExpiryDate(tokenCredentials)
    }

    public async authRefresh(refreshToken:string, expiryDate: number): Promise<ITokensCredentials> {
        if (this.calcTokenExpiryDate(expiryDate)) return this.refreshToken(refreshToken)
        return null
    }

    public async getUserInfo(params: Partial<IProfileParams>): Promise<IProfileResponse> {
        params.alt = 'json'
        const body = querystring.stringify(params)
        const res = await this.request({
            url: this.userInfoUrl
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const defaultErrorMessage = 'In request for get user info.'
        const profile: IProfileResponse = await res.json()
        return this.handleResponse<IProfileResponse>(res, profile, defaultErrorMessage)
    }

    public async revokeToken(accessToken: string) {
        const body = querystring.stringify({
            token: accessToken
        })

        const res = await this.request({
            url: this.revokeTokenUrl
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const defaultErrorMessage = 'In request for revoke authentication access token.'
        const value = await res.json()
        return this.handleResponse(res, value, defaultErrorMessage)
    }

    protected async getTokensCredentials(code: string, {
        clientId
        , redirectUri
        , codeVerifier
    }: IGetTokenOptions = {}): Promise<ITokensCredentials> {
        const params: Partial<ITokensRequestParams> = {
            code
            , grant_type: GrantTypes.authorizationCode
            , code_verifier: codeVerifier
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
        }

        const body = querystring.stringify(params)
        const res = await this.request({
            url: this.tokenUrl
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const defaultErrorMessage = 'In request for get access tokens.'
        const tokens: ITokensCredentials = await res.json()
        return this.handleResponse<ITokensCredentials>(res, tokens, defaultErrorMessage)
    }

    protected async refreshToken(refreshToken: string, clientId?: string): Promise<ITokensCredentials> {
        const params = {
            grant_type: GrantTypes.refreshToken
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , refresh_token: refreshToken
        }

        const body = querystring.stringify(params)
        const res = await this.request({
            url: this.tokenUrl
            , body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const defaultErrorMessage = 'In request for refresh access tokens.'
        const tokens = await res.json()
        return this.handleResponse(res, tokens, defaultErrorMessage)
    }

    protected calcTokenExpiryDate(expiryDate: number): boolean {
        const seconds = 60 * 5
        const currentTimeInSeconds = (new Date().getTime() / 1000) - seconds
        return expiryDate <= currentTimeInSeconds
    }

    protected addTokenExpiryDate(tokens: ITokensCredentials): ITokensCredentialsFinal {
        const expiryDate = (new Date().getTime() / 1000) + tokens.expires_in
        return {
            ...tokens
            , expiry_date: expiryDate
        }
    }

    protected prepareAuthParams(options: IGoogleGenerateAuthOptions = {}): Partial<IGoogleGenerateAuthOptions> {
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
}

