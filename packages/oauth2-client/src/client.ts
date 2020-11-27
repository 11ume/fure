import { RequestInit } from 'node-fetch'

export type Request = (url: string, options?: RequestInit) => Promise<Response>

type CodeChallengeMethod = 'plain' | 'S256'
export interface IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    generateAuthUrl(): string
    callbackHandler(): any
    revokeToken(): any
}

interface OAuth2ClientOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly request: Request
}

export class OAuth2Client implements IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    readonly request: Request

    /**
     * Recommended. Specifies what method was used to encode a 'code_verifier'
     * that will be used during authorization code exchange. This parameter must
     * be used with the 'code_challenge' parameter. The value of the
     * 'code_challenge_method' defaults to "plain" if not present in the request
     * that includes a 'code_challenge'. The only supported values for this
     * parameter are "S256" or "plain".
     */
    readonly codeChallengeMethod?: CodeChallengeMethod
    /**
     * Recommended. Specifies an encoded 'code_verifier' that will be used as a
     * server-side challenge during authorization code exchange. This parameter
     * must be used with the 'code_challenge' parameter described above.
     */
    readonly codeChallenge?: string

    constructor({
        clientId
        , clientSecret
        , redirectUri
        , request
    }: OAuth2ClientOptions) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.request = request
    }

    generateAuthUrl(): string {
        return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }
}
