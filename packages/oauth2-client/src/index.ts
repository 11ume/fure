import { OAuth2Client, OAuth2ClientOptions } from './oAuth2Client'
import { fetch } from './fetch'

export const createOAuth2Client = (options: Omit<OAuth2ClientOptions, 'fetch'>) => {
    return new OAuth2Client({
        ...options
        , fetch
    })
}

