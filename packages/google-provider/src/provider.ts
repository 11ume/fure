import querystring from 'querystring'
import { deleteFalsyValues } from 'fure-shared'
import { Response } from 'node-fetch'
import {
    IFureOAuth2Provider
    , IGetTokenOptions
    , ITokenCredentials
    , ITokenCredentialsError
    , ITokenRequestValues
    , GenerateAuthResult
    , IOAuth2ProviderOptions
    , FureOAuth2Provider
    , AuthTokenResponse
} from 'fure-oauth2'
import {
    IGoogleGenerateAuthOptions
    , Prompt
    , AccessType
    , ResponseType
    , CodeChallengeMethod
} from './options'

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

// interface UserParameters {
//     /**
//      * Data format for the response.
//      * @value json
//      */
//     alt?: 'json'
//     /**
//      * Selector specifying which fields to include in a partial response.
//      */
//     fields?: string
//     /**
//      * API key. Your API key identifies your project and provides you with API access, quota, and reports.
//      * Required unless you provide an OAuth 2.0 token.
//      */
//     key: string

//     /**
//      * OAuth 2.0 token for the current user.
//      */
//     oauth_token: string

//     /**
//      * Returns response with indentations and line breaks.
//      */
//     prettyPrint: boolean

//     /**
//      * An opaque string that represents a user for quota purposes. Must not exceed 40 characters.
//      */
//     quotaUser: string
// }

type GetTokenResponseError = {
    status: number
    message: string
    description: string
}

type GetTokenResponse = {
    error: GetTokenResponseError
    credentials: ITokenCredentials
}

enum GrantTypes {
    authorizationCode = 'authorization_code'
}

// https://accounts.google.com/.well-known/openid-configuration

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

    public generateAuth(params: IGoogleGenerateAuthOptions = {}): GenerateAuthResult {
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

    public authenticate(currentUrl: string, options?: IGetTokenOptions): Promise<ITokenCredentials> {
        const callbackUrlObj = new URL(`${this.parsedRedirectUrl.protocol}//${this.parsedRedirectUrl.host}${currentUrl}`)
        const callbackUrlQueryObj = this.getQueryObjectFromUrl(callbackUrlObj)
        const code = this.getRequiredParam('code', callbackUrlQueryObj)
        return this.getTokenOnAuthenticate(code, options)
    }

    // public async getUserInfo(accessToken: string) {
    //     const res = await this.fetch(this.userInfoUrl, {
    //         body
    //         , method: 'POST'
    //         , headers: {
    //             'Content-Type': 'application/x-www-form-urlencoded'
    //         }
    //     })

    //     return res
    // }

    private async getTokenOnAuthenticate(code: string, options: IGetTokenOptions): Promise<ITokenCredentials> {
        const res = await this.getToken(code, options)
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

    private async getToken(code: string, {
        clientId
        , redirectUri
        , codeVerifier
    }: IGetTokenOptions = {}): Promise<GetTokenResponse> {
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

    private handleGetTokenSuccess(body: ITokenCredentials): GetTokenResponse {
        return {
            error: null
            , credentials: body
        }
    }

    private handleGetTokenError(status: number, body: ITokenCredentialsError): GetTokenResponse {
        const message = body.error ?? 'Get token response error.'
        const description = body.error_description ?? 'No description.'
        const error = {
            status
            , message
            , description
        }
        return {
            error
            , credentials: null
        }
    }

    private async handleGetTokenResponse(res: Response): Promise<GetTokenResponse> {
        const body: AuthTokenResponse = await res.json()
        if (res.ok) return this.handleGetTokenSuccess(body)
        return this.handleGetTokenError(res.status, body)
    }

    private makeGetTokenRequest(values: Partial<ITokenRequestValues>): Promise<Response> {
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

