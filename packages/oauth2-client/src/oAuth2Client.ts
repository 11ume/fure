import querystring from 'querystring'
import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { deleteEmptyValues } from './utils'

interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly authenticationUrl: string
    readonly tokenUrl: string
}

export type GenerateAuthUrlOptions = {
    [key: string]: string | string[] | boolean
}

type GetTokenOptions = {
    code: string
    clientId: string
    redirectUri: string
    codeVerifier?: string
}

export class OAuth2Client {
    /**
     * Application ID.
     */
    readonly clientId: string

    /**
     * Application unique secret key.
     * This application secret key should never be included in client-side code or in binaries that
     * could be decompiled. It is extremely important that it remains completely secret
     * as it is the core of the security of your app and all the people using it.
     */
    readonly clientSecret: string

    /**
     * The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     */
    readonly redirectUri: string

    /**
    * URL used for create an authorization token.
    */
    readonly tokenUrl: string

    /**
     * URL used for create an authorization request link.
     */
    readonly authenticationUrl: string

    constructor({
        clientId
        , clientSecret
        , redirectUri
        , tokenUrl
        , authenticationUrl
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.tokenUrl = tokenUrl
        this.authenticationUrl = authenticationUrl
    }

    private prepareAuthUrlParams(options: GenerateAuthUrlOptions): GenerateAuthUrlOptions {
        let scope = options.scope
        if (options.scope instanceof Array) {
            scope = options.scope.join(' ')
        }

        return {
            ...options
            , scope
        }
    }

    fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        return fetch(url, init)
    }

    /**
     * Generate URI for consent page landing.
     * @return URI to consent page.
     */
    generateAuthenticationUrl(options: GenerateAuthUrlOptions): string {
        const params = this.prepareAuthUrlParams(options)
        const cleanedParams = deleteEmptyValues(params)
        const queryParams = querystring.stringify(cleanedParams)
        return `${this.authenticationUrl}?${queryParams}`
    }

    /**
     * Gets the access token for the given code.
     * @typedef {GetTokenOptions}
     * @param {string} GetTokenOptions.code Authorization code.
     * @param {string} GetTokenOptions.clientId Application ID.
     * @param {string} GetTokenOptions.redirectUri The URL that you want to redirect the person logging in back to. This URL will capture the response from the Login Dialog.
     * @param {string} GetTokenOptions.codeVerifier Is a high-entropy cryptographic random string using the unreserved characters .
     */
    async getToken({
        code
        , clientId
        , redirectUri
        , codeVerifier = null
    }: GetTokenOptions) {
        const values = {
            code
            , client_secret: this.clientSecret
            , code_verifier: codeVerifier
            , client_id: clientId ?? this.clientId
            , redirect_uri: redirectUri ?? this.redirectUri
            , grant_type: 'authorization_code'
        }

        const cleanedValues = deleteEmptyValues(values)
        const res = await this.fetch(this.tokenUrl, {
            method: 'POST'
            , body: querystring.stringify(cleanedValues)
            , headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        return res
    }
}
