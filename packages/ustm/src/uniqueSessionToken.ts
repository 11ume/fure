import { v4 as uuidv4 } from 'uuid'
import { IStorage } from 'fure-storage'

export interface IUniqueSessionTokenManager {
    readonly enabled: boolean
    create(): string
    save(code: string): void
    valid(code: string): boolean
}

export class UniqueSessionTokenManager implements IUniqueSessionTokenManager {
    readonly #storage: IStorage
    readonly enabled: boolean
    constructor(storage: IStorage, enabled: boolean) {
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

