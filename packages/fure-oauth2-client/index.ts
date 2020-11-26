export class FureOAuth2Client {
    constructor(
        readonly clientId: string
        , readonly clientSecret: string
        , readonly redirectUri: string) {
        this.clientId = clientId
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
    }
}
