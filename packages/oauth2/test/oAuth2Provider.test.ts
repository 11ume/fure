import test from 'ava'
import { DummyFureOAuth2Provider } from './healpers/dummyFureOAuth2Provider'
import { FureOAuth2Provider } from '..'
import { DummyStore, IStorage } from 'fure-storage'

const provider = 'dummy provider'
const clientId = '1234'
const clientSecret = 'abcd'
const scope = ['foo', 'bar']
const redirectUri = 'http://localhost:3000/auth/callback'
const authenticationUrl = 'https://accounts.com/oauth2/auth'

type Options = {
    state: boolean
    store?: IStorage
}

const createOAuth2Provider = ({ state = false, store = null }: Options) => new DummyFureOAuth2Provider(provider, authenticationUrl, {
    state
    , store
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
    t.is(fureOAuth2Provider.sessionTokenManager, null)
    t.is(fureOAuth2Provider.storage, null)
})

test('throws when state is "true" and store is "null"', (t) => {
    const error = t.throws(() => createOAuth2Provider({
        state: true
    }))

    t.is(error.message, 'If the state parameter is true, you must pass a valid storage entity')
})

test('throws when state is "false" and a valid storage entity is passed', (t) => {
    const store = new DummyStore()
    const error = t.throws(() => createOAuth2Provider({
        state: false
        , store
    }))

    t.is(error.message, 'If you pass a Storage entity, the state parameter must be true')
})

test('throws when state is "true" and a "invalid" storage "literal" entity is passed', (t) => {
    const store: any = {
        add: () => undefined
        , remove: () => true
    }

    const error = t.throws(() => createOAuth2Provider({
        state: true
        , store
    }))

    t.is(error.message, 'Invalid storage, a valid storage object method must be provided')
})

test('when state is "true" and a valid storage entity is passed', (t) => {
    const store = new DummyStore()
    const fureOAuth2Provider = createOAuth2Provider({
        state: true
        , store
    })

    t.true(fureOAuth2Provider.state)
    t.true(fureOAuth2Provider.storage instanceof DummyStore)
})

test('when state is "true" and a "valid" storage "literal" entity is passed', (t) => {
    const store: IStorage = {
        add: () => undefined
        , get: () => ({
            value: 'foo'
        })
        , remove: () => true
    }

    const fureOAuth2Provider = () => createOAuth2Provider({
        state: true
        , store
    })

    t.notThrows(fureOAuth2Provider)
})
