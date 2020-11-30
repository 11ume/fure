/* eslint-disable camelcase */
import test from 'ava'
import fureOAuth2GoogleProvider from '..'
import { GoogleOAuth2ProviderOptions } from '../src/provider'
import nock from 'nock'

const baseUrl = 'https://www.googleapis.com/oauth2/v4'

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
    const includeGrantedScopes = true
    const loginHint = 'asd@asd.com'
    const codeChallenge = 'abcd'
    const codeChallengeMethod = 'plain'

    const url = googleAauth2.generateAuthUrl({
        hd
        , loginHint
        , codeChallenge
        , codeChallengeMethod
        , includeGrantedScopes
    })
    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('hd'), hd)
    t.is(searchParams.get('include_granted_scopes'), String(includeGrantedScopes))
    t.is(searchParams.get('login_hint'), loginHint)
    t.is(searchParams.get('code_challenge'), codeChallenge)
    t.is(searchParams.get('code_challenge_method'), codeChallengeMethod)
})

test('create generic authentication URL piorice params passed in the method', (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider({
        prompt: 'consent'
        , accessType: 'offline'
        , responseType: 'code'
        , redirectUri: 'http://localhost:4000/callback'
        , scope: ['openid', 'email']
        , codeChallengeMethod: 'S256'
        , includeGrantedScopes: true
    })

    const prompt = 'none'
    const accessType = 'online'
    const redirectUri = 'http://localhost:3000/callback'
    const responseType = 'code'
    const scope = ['foo', 'bar']
    const codeChallengeMethod = 'plain'
    const codeChallenge = 'foobar'
    const includeGrantedScopes = false

    const url = googleAauth2.generateAuthUrl({
        prompt
        , scope
        , accessType
        , redirectUri
        , responseType
        , codeChallenge
        , codeChallengeMethod
        , includeGrantedScopes
    })

    const { searchParams, origin, pathname } = new URL(url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('prompt'), prompt)
    t.is(searchParams.get('access_type'), accessType)
    t.is(searchParams.get('redirect_uri'), redirectUri)
    t.is(searchParams.get('response_type'), responseType)
    t.is(searchParams.get('include_granted_scopes'), String(includeGrantedScopes))
    t.is(searchParams.get('code_challenge_method'), codeChallengeMethod)
    t.is(searchParams.get('scope'), scope.join(' '))
})

test('get access authentication token', async (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider()
    const scope = nock(baseUrl, {
        reqheaders: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    })
        .post('/token')
        .reply(200, {
            access_token: 'abc123'
            , expires_in: 300
            , id_token: 'abc123'
            , refresh_token: 'abc123'
            , scope: 'email'
            , token_type: 'authorization_code'
        })

    const res = await googleAauth2.authenticate('/foo/auth?code=123')
    scope.done()

    t.is(res.access_token, 'abc123')
    t.is(res.expires_in, 300)
    t.is(res.id_token, 'abc123')
    t.is(res.refresh_token, 'abc123')
    t.is(res.scope, 'email')
    t.is(res.token_type, 'authorization_code')
})

