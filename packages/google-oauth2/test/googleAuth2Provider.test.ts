import test from 'ava'
import fureOAuth2GoogleProvider from '..'

const clientId = '1234'
const clientSecret = 'abcd'
const redirectUri = 'http://localhost:3000/auth/google/callback'

test('generation of generic authentication URL', (t) => {
    const googleAauth2 = fureOAuth2GoogleProvider({
        clientId
        , clientSecret
        , redirectUri
    })

    const url = googleAauth2.generateAuthUrl()
    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('prompt'), null)
    t.is(searchParams.get('response_type'), googleAauth2.responseType)
    t.is(searchParams.get('access_type'), googleAauth2.accessType)
    t.is(searchParams.get('scope'), googleAauth2.scope.join(' '))
    t.is(searchParams.get('client_id'), clientId)
    t.is(searchParams.get('redirect_uri'), redirectUri)
})

// test('generation of generic authentication URL, pass optional parameters', (t) => {
// })

// test('generation of generic authentication URL, whit all supported parameters', (t) => {
// })
