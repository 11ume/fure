// https://accounts.google.com/.well-known/openid-configuration
import {
    IFureOAuth2Provider
    , IGetTokenOptions
    , ITokenCredentialsResponse
    , ITokenRequestParams
    , IGenerateAuthResult
    , IOAuth2ProviderOptions
    , FureOAuth2Provider
    , AuthTokenResponse
    , ResponseError
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
    codeVerifier?: string
    codeChallenge?: string
}

type GetTokenResponse = {
    error: ResponseError | null
    value: ITokenCredentialsResponse | null
}

enum GrantTypes {
    authorizationCode = 'authorization_code'
}

/**
 * Authentication provider.
 */
const PROVIDER = 'google'

/**
 * Base URL for token retrieval.
 */
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/**
 * Base URL for handle authentication.
 */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

/**
 * Base URL for obtain user information of some access token.
 */
const GOOGLE_USER_INFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

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
    readonly userInfoUrl: string
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
    }

    public generateAuth(params: IGoogleGenerateAuthOptions = {}): IGenerateGoogleAuthResult {
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

    public async authenticate(currentUrl: string, options?: IGetTokenOptions): Promise<ITokenCredentialsResponse> {
        const callbackUrlObj = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentUrl}`)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getRequiredParam('code', callbackUrlQueryObj)
        const token = await this.getToken(code, options)
        return token.value
    }

    public async getProfile(params: Partial<IProfileParams>) {
        const res = await this.getUserInfo(params)
        return res.value
    }

    private async getUserInfo(params: Partial<IProfileParams>) {
        params.alt = 'json'
        const res = await this.makePostRequest(this.userInfoUrl, params)
        return this.handleJsonResponse<IProfileResponse>(res)
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

    private async getToken(code: string, {
        clientId
        , redirectUri
        , codeVerifier
    }: IGetTokenOptions = {}): Promise<GetTokenResponse> {
        const params: Partial<ITokenRequestParams> = {
            code
            , grant_type: GrantTypes.authorizationCode
            , code_verifier: codeVerifier
            , client_secret: this.clientSecret
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
        }

        const res = await this.makePostRequest(this.tokenUrl, params)
        return this.handleJsonResponse<AuthTokenResponse>(res)
    }
}

