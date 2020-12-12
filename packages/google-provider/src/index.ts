import { FureGoogleOAuth2Provider, IGoogleOAuth2ProviderOptions } from './provider'

// The base endpoint for get token information.
// const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

const createFureOAuth2GoogleProvider = (options: IGoogleOAuth2ProviderOptions) => {
    return new FureGoogleOAuth2Provider(options)
}

export default createFureOAuth2GoogleProvider
