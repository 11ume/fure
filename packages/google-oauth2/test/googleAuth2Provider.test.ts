/* eslint-disable camelcase */
import test from 'ava'
import fureOAuth2GoogleProvider from '..'
import { GoogleOAuth2ProviderOptions } from '../src/provider'

const createFureOAuth2GoogleProvider = (options?: Omit<GoogleOAuth2ProviderOptions, 'clientId' | 'clientSecret'>) => {
    const clientId = '1234'
    const clientSecret = 'abcd'
    const redirectUri = 'http://localhost:3000/auth/google/callback'
    return fureOAuth2GoogleProvider({
        ...options
        , clientId
        , clientSecret
        , redirectUri
    })
}

test('create generic authentication URL', (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider()
    const url = googleAauth2.generateAuthUrl()
    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('prompt'), null)
    t.is(searchParams.get('response_type'), googleAauth2.responseType)
    t.is(searchParams.get('access_type'), googleAauth2.accessType)
    t.is(searchParams.get('scope'), googleAauth2.scope.join(' '))
    t.is(searchParams.get('client_id'), googleAauth2.clientId)
    t.is(searchParams.get('redirect_uri'), googleAauth2.redirectUri)
})

test('create generic authentication URL whit uncommon params', (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider()

    const hd = '*'
    const include_granted_scopes = true
    const login_hint = 'asd@asd.com'
    const code_challenge = 'abcd'
    const code_challenge_method = 'plain'

    const url = googleAauth2.generateAuthUrl({
        hd
        , loginHint: login_hint
        , codeChallenge: code_challenge
        , codeChallengeMethod: code_challenge_method
        , includeGrantedScopes: include_granted_scopes
    })
    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('hd'), hd)
    t.is(searchParams.get('include_granted_scopes'), 'true')
    t.is(searchParams.get('login_hint'), login_hint)
    t.is(searchParams.get('code_challenge'), code_challenge)
    t.is(searchParams.get('code_challenge_method'), code_challenge_method)
})

test('create generic authentication URL piorice params passed in the method', (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider({
        prompt: 'consent'
        , accessType: 'offline'
        , responseType: 'code'
        , redirectUri: 'http://localhost:4000/callback'
        , scope: ['openid', 'email']
    })

    const prompt = 'none'
    const accessType = 'online'
    const redirectUri = 'http://localhost:3000/callback'
    const responseType = 'code'
    const scope = ['foo', 'bar']

    const url = googleAauth2.generateAuthUrl({
        prompt
        , scope
        , accessType
        , redirectUri
        , responseType
    })

    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('prompt'), prompt)
    t.is(searchParams.get('access_type'), accessType)
    t.is(searchParams.get('redirect_uri'), redirectUri)
    t.is(searchParams.get('response_type'), responseType)
    t.is(searchParams.get('scope'), scope.join(' '))
})

// test('generation of generic authentication URL, pass optional parameters', (t) => {
// })

// test('generation of generic authentication URL, whit all supported parameters', (t) => {
// })
