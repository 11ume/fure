import querystring from 'querystring'
import { Response } from 'node-fetch'
import { FureProvider } from 'fure-provider'
import { deleteFalsyValues, getRequiredParam } from 'fure-shared'
import { v4 as uuidv4 } from 'uuid'
import { createPkce } from 'fure-oauth2-pkce'
import { Fetch, fetch } from './fetch'
import { IGenerateAuthOptions, IGetTokenOptions } from './options'
import { ITokenCredentialsResponse } from './credentials'

type GeneratePkceResult = {
    codeVerifier: string
    codeChallenge: string
}

type GenerateAuthUrlParams = {
    [key: string]: string | string[] | boolean
}

type JsonResponse<T> = {
    error: ResponseError | null
    value: T | null
}

type ResponseSuccessResult<T> = {
    error: ResponseError | null
    value: T | null
}

type ResponseErrorResult = {
    error: ResponseError
    value: null
}

type ResponseErrorBody = {
    error?: string
    error_description?: string
}

export type ResponseError = {
    status: number
    message: string
    description: string
}

export interface IGenerateAuthResult {
    url: string
    state?: string
}

export interface IFureOAuth2Provider {
    generateAuth(options: Partial<IGenerateAuthOptions>): IGenerateAuthResult
    authenticate(url: string, options?: IGetTokenOptions): Promise<ITokenCredentialsResponse>
    revokeToken?(): Promise<any>
    verifyToken?(): Promise<any>
    refreshToken?(): Promise<any>
}

export interface IOAuth2ProviderOptions {
    readonly provider: string
    readonly tokenUrl: string
    readonly authenticationUrl: string
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
    protected readonly fetch?: Fetch
    protected constructor({
        provider
        , tokenUrl
        , authenticationUrl
        , clientId
        , clientSecret
        , redirectUri
        , state
        , scope
    }: IOAuth2ProviderOptions) {
        super(provider)
        this.fetch = fetch
        this.provider = provider
        this.tokenUrl = tokenUrl
        this.authenticationUrl = authenticationUrl
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.state = state
        this.scope = scope
        this.parsedRedirectUrl = new URL(redirectUri)
    }

    public generateAuthenticationUrl(params: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): string {
        const preparedParams = this.prepareAuthUrlParams(params, state, codeChallenge)
        const cleanedParams = deleteFalsyValues(preparedParams)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }

    protected handleResponseSuccess<T>(body: T): ResponseSuccessResult<T> {
        return {
            error: null
            , value: body
        }
    }

    protected handleResponseError(status: number, body: ResponseErrorBody): ResponseErrorResult {
        const message = body.error ?? 'Get token response error.'
        const description = body.error_description ?? 'No description.'
        const error = {
            status
            , message
            , description
        }

        return {
            error
            , value: null
        }
    }

    protected async handleJsonResponse<T>(res: Response): Promise<JsonResponse<T>> {
        const body = await res.json()
        if (res.ok) return this.handleResponseSuccess(body)
        const err = this.handleResponseError(res.status, body)
        const { status, message, description } = err.error
        throw this.error(status, message, description)
    }

    protected makePostRequest<P extends querystring.ParsedUrlQueryInput>(url: string, params: Partial<P>): Promise<Response> {
        const body = querystring.stringify(params)
        const res = this.fetch(url, {
            body
            , method: 'POST'
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        return res
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
        throw this.error(401, `Required param ${id}`, `The ${id} param is missing, or it has been altered.`)
    }

    private prepareAuthUrlParams(options: GenerateAuthUrlParams
        , state: string
        , codeChallenge: string): GenerateAuthUrlParams {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }

        return {
            ...options
            , state
            , scope
            , code_challenge: codeChallenge
        }
    }
}
