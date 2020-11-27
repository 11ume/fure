import { FureGoogleOAuth2Provider, GoogleOAuth2ProviderOptions } from './googleAuth2Provider'
import { OAuth2Client } from 'fure-oauth2-client'

type Omittables = 'provider' | 'oAuth2Client' | 'uniqueSessionTokenManager'
interface CreateFureGoogleOAuthProOps extends GoogleOAuth2ProviderOptions {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

const createFureOAuth2GoogleProvider = (options: Omit<CreateFureGoogleOAuthProOps, Omittables>) => {
    const {
        clientId
        , clientSecret
        , authPath
        , redirectUri
    } = options
    const oAuth2Client = new OAuth2Client({
        clientId
        , clientSecret
        , redirectUri
        , authenticationUrl: GOOGLE_AUTH_URL
    })

    return new FureGoogleOAuth2Provider({
        authPath
        , oAuth2Client
    })
}

export default createFureOAuth2GoogleProvider
