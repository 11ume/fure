export type Value = {
    value: string
}

export interface IStorage {
    add(value: string): void
    get(value: string): Value
    remove(value: string): boolean
}

/**
 * The storage class is common used for store the unique session token, {state} param.
 * This class only has the objective, to be used for internal tests, never be used in production environments.
 * Is recommended to use an external in memory database, where you can store the values with a expiration time.
 */
export class DummyStore implements IStorage {
    readonly #db: Map<string, Value> = new Map()
    add = (value: string): void => {
        this.#db.set(value, {
            value
        })
    }

    get = (value: string): Value => this.#db.get(value)
    remove = (value: string): boolean => this.#db.delete(value)
}

export const createStorage = () => new DummyStore()
