import querystring from 'querystring'
import { FureOAuth2Client } from 'fure-oauth2-client'
import { camelize, getRequiredParam } from 'fure-shared'
import { UniqueSessionTokenManager } from 'fure-ustm'

type UserInfo = {
    email: string
    familyName: string
    givenName: string
    id: string
    locale: string
    name: string
    picture: string
    verifiedEmail: boolean
}

export type Credentials = {
    scope?: string
    idToken?: string | null
    expirydate?: number | null
    refreshToken?: string | null
    accessToken?: string | null
    tokenType?: string | null
}

export type OpenIdData = {
    info: Partial<UserInfo>
    tokens: Credentials
}

export type AccessType = 'offline' | 'online'
export type Prompt = 'none' | 'consent' | 'select_account'

const USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

interface GoogleOAutoOpenIDApiOptions {
    readonly scope: string[]
    readonly prompt: Prompt
    readonly accessType: AccessType
    readonly oAuth2Client: FureOAuth2Client
    readonly uniqueSessionTokenManager: UniqueSessionTokenManager
}

// https://developers.google.com/identity/protocols/oauth2/openid-connect
export class GoogleOAutoOpenIDApi {
    private readonly scope: string[]
    private readonly prompt: Prompt
    private readonly accessType: AccessType
    private readonly oAuth2Client: FureOAuth2Client
    private readonly uniqueSessionTokenManager: UniqueSessionTokenManager
    constructor({
        scope
        , prompt
        , accessType
        , oAuth2Client
        , uniqueSessionTokenManager
    }: GoogleOAutoOpenIDApiOptions) {
        this.scope = scope
        this.prompt = prompt
        this.accessType = accessType
        this.oAuth2Client = oAuth2Client
        this.uniqueSessionTokenManager = uniqueSessionTokenManager
    }

    private generateAuthUrl(state: string = null) {
        return this.oAuth2Client.generateAuthUrl({
            access_type: this.accessType
            , scope: this.scope
            , prompt: this.prompt
            , state
        })
    }

    private generateAuthUrlWhitState() {
        const state = this.uniqueSessionTokenManager.create()
        const authRedirectUri = this.generateAuthUrl(state)
        this.uniqueSessionTokenManager.save(state)
        return authRedirectUri
    }

    async getUserInfo(parsedUrlQuery: querystring.ParsedUrlQuery): Promise<OpenIdData> {
        const code = getRequiredParam('code', parsedUrlQuery.code)
        const getToken = await this.oAuth2Client.getToken(code)
        this.oAuth2Client.setCredentials(getToken.tokens)
        const resUserInfo = await this.oAuth2Client.request({
            url: USER_INFO_URL
        })

        const info = camelize(resUserInfo.data)
        const tokens = camelize(getToken.tokens)
        return {
            info
            , tokens
        }
    }

    createAuthUrl() {
        if (this.uniqueSessionTokenManager.enabled) {
            return this.generateAuthUrlWhitState()
        }

        return this.generateAuthUrl()
    }

    revokeToken(accessToken: string) {
        return this.oAuth2Client.revokeToken(accessToken)
    }
}

const createGoogleOAutoOpenIDApi = (options: GoogleOAutoOpenIDApiOptions) => new GoogleOAutoOpenIDApi(options)
export default createGoogleOAutoOpenIDApi
