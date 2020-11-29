/* eslint-disable camelcase */
import test from 'ava'
import fureOAuth2GoogleProvider from '..'

const clientId = '1234'
const clientSecret = 'abcd'
const redirectUri = 'http://localhost:3000/auth/google/callback'

test('create generic authentication URL', (t) => {
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

test('create generic authentication URL whit uncommon params', (t) => {
    const googleAauth2 = fureOAuth2GoogleProvider({
        clientId
        , clientSecret
        , redirectUri
    })

    const hd = '*'
    const include_granted_scopes = true
    const login_hint = 'asd@asd.com'
    const code_challenge = 'abcd'
    const code_challenge_method = 'plain'

    const url = googleAauth2.generateAuthUrl({
        hd
        , login_hint
        , code_challenge
        , code_challenge_method
        , include_granted_scopes
    })
    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('hd'), hd)
    t.is(searchParams.get('include_granted_scopes'), 'true')
    t.is(searchParams.get('login_hint'), login_hint)
    t.is(searchParams.get('code_challenge'), code_challenge)
    t.is(searchParams.get('code_challenge_method'), code_challenge_method)
})

// test('generation of generic authentication URL, pass optional parameters', (t) => {
// })

// test('generation of generic authentication URL, whit all supported parameters', (t) => {
// })
