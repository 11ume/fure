import { v4 as uuidv4 } from 'uuid'
import { Storage } from 'fure-storage'

/*
 * An opaque string that is round-tripped in the protocol;
 * that is to say, it is returned as a URI parameter in the Basic flow, and in the URI #fragment
 * identifier in the Implicit flow.
 * The state can be useful for correlating requests and responses.
 * Because your redirect_uri can be guessed, using a state value can increase your assurance that an incoming connection is the result of an authentication request initiated by your app. If you generate a random string or encode the hash of some client state (e.g., a cookie) in this state variable, you can validate the response to additionally ensure that the request and response originated in the same browser. This provides protection against attacks such as cross-site request forgery.
 **/
export class UniqueSessionTokenManager {
    readonly #storage: Storage
    readonly enabled: boolean
    constructor(storage: Storage, enabled: boolean) {
        this.#storage = storage
        this.enabled = enabled
    }

    create = (): string => uuidv4()
    save = (code: string): void => this.#storage.add(code)
    valid = (code: string): boolean => {
        const found = this.#storage.get(code)
        if (found?.value) {
            this.#storage.remove(found.value)
            return true
        }

        return false
    }
}

