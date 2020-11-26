export type Value = {
    value: string
}

export interface Storage {
    add(value: string): void
    get(value: string): Value
    remove(value: string): boolean
}

export class DummyStore implements Storage {
    readonly #db: Map<string, Value> = new Map()
    add = (value: string): void => {
        this.#db.set(value, {
            value
        })
    }

    get = (value: string): Value => this.#db.get(value)
    remove = (value: string): boolean => this.#db.delete(value)
}

const createStorage = () => new DummyStore()
export default createStorage
