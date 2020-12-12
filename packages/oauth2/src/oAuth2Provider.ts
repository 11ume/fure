import querystring from 'querystring'
import { v4 as uuidv4 } from 'uuid'
import { createError } from 'fure-error'
import { FureProvider } from 'fure-provider'
import { createPkce } from 'fure-oauth2-pkce'
import { deleteFalsyValues, getRequiredParam } from './utils'
import { IGenerateAuthUrlOptions } from './options'
import { ITokenCredentials, ITokenGetOptions } from './credentials'
import createTransport, {
    Transport
    , Response
    , RequestOptions
    , ResponseOptions
} from './transport'

type GeneratePkceResult = {
    codeVerifier: string
    codeChallenge: string
}

type GenerateAuthUrlParams = {
    [key: string]: string | string[] | boolean
}

export interface IGenerateAuthUrlParams {
    scope?: string | string[]
    state?: boolean
    client_id?: string
    redirect_uri?: string
    response_type?: string
}

export interface IGenerateAuthResult {
    url: string
    state?: string | null
}

export interface IAuthenticateOptions {
    token?: ITokenGetOptions
}

export interface IFureOAuth2Provider<T> {
    authGenerateUrl(options: Partial<IGenerateAuthUrlOptions>): IGenerateAuthResult
    auth(url: string, options?: IAuthenticateOptions): Promise<T>
    authRefresh?(refreshToken:string, expiryDate: number): Promise<ITokenCredentials>
    authRevoke?(accessToken: string): Promise<any>
    authVerify?(): Promise<any>
}
export interface IOAuth2Options {
    readonly provider: string
    readonly tokenUrl: string
    readonly authenticationUrl: string
}
export interface IOAuth2ProviderOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly state?: boolean
    readonly scope?: string[]
}

export class FureOAuth2Provider extends FureProvider {
    readonly provider: string
    readonly tokenUrl: string
    readonly authenticationUrl: string
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly state: boolean
    readonly scope: string[]
    protected readonly parsedRedirectUrl: URL
    private readonly transport: Transport
    protected constructor({
        provider
        , tokenUrl
        , authenticationUrl
    }: IOAuth2Options, {
        clientId
        , clientSecret
        , redirectUri
        , state
        , scope
    }: IOAuth2ProviderOptions) {
        super(provider)
        this.provider = provider
        this.tokenUrl = tokenUrl
        this.authenticationUrl = authenticationUrl
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.state = state
        this.scope = scope
        this.parsedRedirectUrl = new URL(redirectUri)
        this.transport = createTransport()
    }

    protected request(options: RequestOptions) {
        return this.transport.request(options)
    }

    protected response<T>(res: Response, options: ResponseOptions<T>) {
        return this.transport.response(res, options)
    }

    protected generateAuthenticationUrl(params: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): string {
        const preparedParams = this.prepareAuthUrlParams(params, state, codeChallenge)
        const cleanedParams = deleteFalsyValues(preparedParams)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }

    protected generateAuthStateParam(state: boolean): string {
        const uuid = uuidv4()
        return state ? uuid : null
    }

    protected generatePkce(codeChallange: boolean): GeneratePkceResult {
        const pkce = createPkce()
        if (codeChallange) return pkce.generate()
        return {
            codeVerifier: null
            , codeChallenge: null
        }
    }

    protected getQueryObjectFromUrl(currentUrl: URL): querystring.ParsedUrlQuery {
        const urlWhioutQuestionMark = currentUrl.search.slice(1)
        return querystring.parse(urlWhioutQuestionMark)
    }

    protected getRequiredParam(id: string, parsedredirectUri: querystring.ParsedUrlQuery): string {
        const param = getRequiredParam(id, parsedredirectUri[id])
        if (param) return param
        throw createError(401, `Required param ${id}`, `The ${id} param is missing, or it has been altered.`)
    }

    private prepareAuthUrlParams(params: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): GenerateAuthUrlParams {
        let scope = params.scope
        if (params.scope instanceof Array) {
            scope = params.scope.join(' ')
        }

        return {
            ...params
            , state
            , scope
            , code_challenge: codeChallenge
        }
    }
}
