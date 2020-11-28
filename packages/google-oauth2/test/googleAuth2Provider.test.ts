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
    const urlParsed = new URL(url)

    t.is(urlParsed.origin + urlParsed.pathname, googleAauth2.authenticationUrl)
    t.is(urlParsed.searchParams.get('scope'), googleAauth2.scope.join(' '))
    t.is(urlParsed.searchParams.get('client_id'), clientId)
    t.is(urlParsed.searchParams.get('redirect_uri'), redirectUri)
    t.is(urlParsed.searchParams.get('response_type'), 'code')
    t.is(urlParsed.searchParams.get('access_type'), 'offline')
})

// test('generation of generic authentication URL, whit all supported parameters', (t) => {
//     const responseType = 'code'
//     const googleAauth2 = fureOAuth2GoogleProvider({
//         clientId
//         , clientSecret
//         , redirectUri
//     })

//     const url = googleAauth2.generateAuthUrl()
//     const urlParsed = new URL(url)

//     t.is(urlParsed.origin + urlParsed.pathname, googleAauth2.authenticationUrl)
//     t.is(urlParsed.searchParams.get('scope'), googleAauth2.scope.join(' '))
//     t.is(urlParsed.searchParams.get('client_id'), clientId)
//     t.is(urlParsed.searchParams.get('redirect_uri'), redirectUri)
//     t.is(urlParsed.searchParams.get('response_type'), responseType)
// })
