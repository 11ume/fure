import { v4 as uuidv4 } from 'uuid'
import { IStorage } from 'fure-storage'

export interface IUniqueSessionTokenManager {
    create(): string
    save(code: string): void
    validate(code: string): boolean
    remove(code: string): boolean
}

/**
 * Anti XSRF token manager.
 * That is used for prevent an request forgery attack, the unique session token is a string of 30 or so characters constructed using a high-quality random-number generator,
 * that holds state between your app and the user's client. It is returned as a URI parameter in the Basic flow, and in the URI #fragment identifier in the Implicit flow.
 * Because your redirect_uri can be guessed, using an unique session token value can increase your assurance that an incoming connection
 * is the result of an authentication request initiated by your app.
 */
export class UniqueSessionTokenManager implements IUniqueSessionTokenManager {
    readonly #storage: IStorage
    constructor(storage: IStorage) {
        this.#storage = storage
    }

    create = (): string => uuidv4()
    save = (code: string): void => this.#storage.add(code)
    remove = (code: string): boolean => this.#storage.remove(code)
    validate = (code: string): boolean => {
        const found = this.#storage.get(code)
        if (found?.value) return true
        return false
    }
}

