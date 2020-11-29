import { IStorage } from '../src/storage'
export const isStore = (store: IStorage) => {
    if (store.add && store.get && store.remove) return true
    return false
}

