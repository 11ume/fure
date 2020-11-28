import { FureGoogleOAuth2Provider, GoogleOAuth2ProviderOptions } from './provider'

// The base endpoint for token retrieval.
// const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token'
// The base endpoint for get token information.
// const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
// The base endpoint for get user information.
// const GOOGLE_USER_INFO = 'https://www.googleapis.com/oauth2/v3/userinfo'

const createFureOAuth2GoogleProvider = (options: GoogleOAuth2ProviderOptions) => {
    return new FureGoogleOAuth2Provider(options)
}

export default createFureOAuth2GoogleProvider
