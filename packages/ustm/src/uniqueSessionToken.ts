import { v4 as uuidv4 } from 'uuid'
import { IStorage } from 'fure-storage'

export interface IUniqueSessionTokenManager {
    create(): string
    save(code: string): void
    validate(code: string): boolean
    remove(code: string): boolean
}

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

