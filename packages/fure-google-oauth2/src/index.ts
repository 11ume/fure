import { FureOAuth2Client } from 'fure-oauth2-client'
import { UniqueSessionTokenManager } from 'fure-ustm'
import { FureGoogleOAuth2Provider, GoogleOAuth2ProviderOptions } from './googleAuth2Provider'

type Omittables = 'provider' | 'oAuth2Client' | 'uniqueSessionTokenManager'

const createOAuth2GoogleProvider = (options: Omit<GoogleOAuth2ProviderOptions, Omittables>) => {
    const {
        store
        , state
        , clientId
        , clientSecret
        , redirectUri
    } = options

    const oAuth2Client = new FureOAuth2Client(clientId, clientSecret, redirectUri)
    const uniqueSessionTokenManager = new UniqueSessionTokenManager(store, state)
    return new FureGoogleOAuth2Provider({
        oAuth2Client
        , uniqueSessionTokenManager
        , ...options
    })
}

export default createOAuth2GoogleProvider
