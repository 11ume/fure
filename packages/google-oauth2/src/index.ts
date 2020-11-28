import { FureGoogleOAuth2Provider, GoogleOAuth2ProviderOptions } from './googleAuth2Provider'
import { OAuth2Client } from 'fure-oauth2-client'

type Omittables = 'provider' | 'oAuth2Client' | 'uniqueSessionTokenManager'
interface CreateFureGoogleOAuthProOps extends GoogleOAuth2ProviderOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
}

/**
 * The base endpoints for handle authentication.
 */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

// The base endpoint for token retrieval.
// const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token'
// The base endpoint for get token information.
// const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
// The base endpoint for get user information.
// const GOOGLE_USER_INFO = 'https://www.googleapis.com/oauth2/v3/userinfo'

const createFureOAuth2GoogleProvider = ({
    clientId
    , clientSecret
    , redirectUri
}: Omit<CreateFureGoogleOAuthProOps, Omittables>) => {
    const oAuth2Client = new OAuth2Client({
        clientId
        , clientSecret
        , redirectUri
        , authenticationUrl: GOOGLE_AUTH_URL
    })

    return new FureGoogleOAuth2Provider({
        oAuth2Client
    })
}

export default createFureOAuth2GoogleProvider
