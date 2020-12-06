import test from 'ava'
import nock from 'nock'
import { FureError } from 'fure-provider/src/error'
import fureOAuth2GoogleProvider, {
    GoogleOAuth2ProviderOptions
    , AccessType
    , CodeChallengeMethod
    , ResponseType
    , Prompt
} from '..'

const createFureOAuth2GoogleProvider = (options?: Partial<GoogleOAuth2ProviderOptions>) => {
    const clientId = 'foobar'
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
    const auth = googleAauth2.generateAuth()
    const { searchParams, origin, pathname } = new URL(auth.url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('client_id'), 'foobar')
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
    const codeChallenge = true
    const codeChallengeMethod = CodeChallengeMethod.S256

    const auth = googleAauth2.generateAuth({
        hd
        , login_hint: loginHint
        , code_challenge: codeChallenge
        , code_challenge_method: codeChallengeMethod
        , include_granted_scopes: includeGrantedScopes
    })
    const { searchParams, origin, pathname } = new URL(auth.url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.is(searchParams.get('hd'), hd)
    t.is(searchParams.get('login_hint'), loginHint)
    t.is(searchParams.get('code_challenge_method'), codeChallengeMethod)
    t.is(searchParams.get('include_granted_scopes'), String(includeGrantedScopes))
    t.is(searchParams.get('code_challenge').length, 43)
})

test('create generic authentication URL piorice params passed in the method', (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider({
        prompt: Prompt.consent
        , accessType: AccessType.offline
        , responseType: ResponseType.code
        , redirectUri: 'http://localhost:4000/callback'
        , scope: ['openid', 'email']
        , codeChallenge: true
        , codeChallengeMethod: CodeChallengeMethod.S256
        , includeGrantedScopes: true
        , state: true
        , clientId: '1234'
    })

    const clientId = '5678'
    const prompt = Prompt.none
    const accessType = AccessType.online
    const redirectUri = 'http://localhost:3000/callback'
    const responseType = ResponseType.codeToken
    const scope = ['foo', 'bar']
    const codeChallengeMethod = null
    const codeChallenge = false
    const includeGrantedScopes = false
    const state = false

    const auth = googleAauth2.generateAuth({
        state
        , prompt
        , scope
        , client_id: clientId
        , access_type: accessType
        , redirect_uri: redirectUri
        , response_type: responseType
        , code_challenge: codeChallenge
        , code_challenge_method: codeChallengeMethod
        , include_granted_scopes: includeGrantedScopes
    })

    const { searchParams, origin, pathname } = new URL(auth.url)
    t.is(origin + pathname, googleAauth2.authenticationUrl)

    t.is(searchParams.get('state'), null)
    t.is(searchParams.get('prompt'), prompt)
    t.is(searchParams.get('client_id'), '5678')
    t.is(searchParams.get('access_type'), accessType)
    t.is(searchParams.get('redirect_uri'), redirectUri)
    t.is(searchParams.get('response_type'), responseType)
    t.is(searchParams.get('scope'), scope.join(' '))
    t.is(searchParams.get('code_challenge_method'), codeChallengeMethod)
    t.is(searchParams.get('include_granted_scopes'), String(includeGrantedScopes))
    t.is(searchParams.get('code_challenge'), null)
})

test('create generic authentication URL whit state enabled', (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider({
        state: true
    })
    const auth = googleAauth2.generateAuth()
    const { searchParams, origin, pathname } = new URL(auth.url)

    t.is(origin + pathname, googleAauth2.authenticationUrl)
    t.true(typeof searchParams.get('state') === 'string')
    t.is(searchParams.get('state').length, 36)
    t.is(searchParams.get('prompt'), null)
    t.is(searchParams.get('response_type'), googleAauth2.responseType)
    t.is(searchParams.get('access_type'), googleAauth2.accessType)
    t.is(searchParams.get('scope'), googleAauth2.scope.join(' '))
    t.is(searchParams.get('client_id'), googleAauth2.clientId)
    t.is(searchParams.get('redirect_uri'), googleAauth2.redirectUri)
})

test('get access token', async (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider()
    const { origin } = new URL(googleAauth2.tokenUrl)

    const scope = 'https://www.googleapis.com/auth/userinfo.email'
    const idToken = 'foobar'
    const tokenType = 'Bearer'
    const expiresIn = 3599
    const accessToken = 'abcd123'
    const refreshToken = 'abcd'

    const mock = nock(origin, {
        reqheaders: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    })
        .post('/token')
        .reply(200, {
            scope
            , id_token: idToken
            , token_type: tokenType
            , expires_in: expiresIn
            , access_token: accessToken
            , refresh_token: refreshToken
        })

    const res = await googleAauth2.authenticate('/auth?code=123')
    mock.done()

    t.is(res.scope, scope)
    t.is(res.id_token, idToken)
    t.is(res.token_type, tokenType)
    t.is(res.expires_in, expiresIn)
    t.is(res.access_token, accessToken)
    t.is(res.refresh_token, refreshToken)
})

test('get access token error', async (t) => {
    const googleAauth2 = createFureOAuth2GoogleProvider()
    const { origin } = new URL(googleAauth2.tokenUrl)
    const mock = nock(origin, {
        reqheaders: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    })
        .post('/token')
        .reply(400, {
            error: 'something has gone wrong'
            , error_description: 'something has gone wrong description'
        })

    const err: FureError = await t.throwsAsync(() => googleAauth2.authenticate('/auth?code=123'))
    mock.done()

    t.is(err.statusCode, 400)
    t.is(err.message, 'something has gone wrong')
    t.is(err.description, 'something has gone wrong description')
})

// necesito interceptar el body de la consulta emitida
// test('get access token when pass params to method', async (t) => {
//     const googleAauth2 = createFureOAuth2GoogleProvider()
//     const { origin } = new URL(googleAauth2.tokenUrl)

//     const scope = 'https://www.googleapis.com/auth/userinfo.email'
//     const idToken = 'foobar'
//     const tokenType = 'Bearer'
//     const expiresIn = 3599
//     const accessToken = 'abcd123'
//     const refreshToken = 'abcd'

//     const mock = nock(origin, {
//         reqheaders: {
//             'content-type': 'application/x-www-form-urlencoded'
//         }
//     })
//         .post('/oauth2/v4/token')
//         .reply(400, {
//             scope
//             , id_token: idToken
//             , token_type: tokenType
//             , expires_in: expiresIn
//             , access_token: accessToken
//             , refresh_token: refreshToken
//         })

//     const err: FureError = await t.throwsAsync(() => googleAauth2.authenticate('/auth?code=123', {
//         redirectUri: 'http://foo/callback'
//         , clientId: 'app'
//     }))
//     mock.done()

//     t.is(err.statusCode, 400)
//     t.is(err.message, 'something has gone wrong')
//     t.is(err.description, 'something has gone wrong description')
// })

