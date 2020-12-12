import test from 'ava'
import { FureOAuth2ProviderDummy } from './healpers/fureOAuth2Provider.dummy'
import { FureOAuth2Provider } from '..'

const provider = 'provider test'
const clientId = '1234'
const clientSecret = 'abcd'
const scope = ['foo', 'bar']
const redirectUri = 'http://localhost:3000/auth/callback'

const tokenUrl = 'https://www.googleapis.com/oauth2/v4/token'
const authenticationUrl = 'https://accounts.com/oauth2/auth'

type Options = {
    state: boolean
}

const createOAuth2Provider = ({ state = false }: Options) => new FureOAuth2ProviderDummy({
    provider
    , authenticationUrl
    , tokenUrl
}, {
    state
    , scope
    , clientId
    , clientSecret
    , redirectUri
})

test('create fure oAuth2 provider instance', (t) => {
    const fureOAuth2Provider = createOAuth2Provider({
        state: false
    })

    t.true(fureOAuth2Provider instanceof FureOAuth2Provider)
    t.is(fureOAuth2Provider.authenticationUrl, authenticationUrl)
    t.is(fureOAuth2Provider.clientId, clientId)
    t.is(fureOAuth2Provider.scope, scope)
    t.is(fureOAuth2Provider.redirectUri, redirectUri)
    t.is(fureOAuth2Provider.authenticationUrl, authenticationUrl)
})
