export interface IOAuth2Client {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    generateAuthUrl(): string
    callbackHandler(): any
    revokeToken(): any
}
export class FureOAuth2Client implements IOAuth2Client {
    constructor(
        readonly clientId: string
        , readonly clientSecret: string
        , readonly redirectUri: string) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
    }

    generateAuthUrl(): string {
        return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() {}
}
