export const deleteEmptyParams = <T>(params: T): Partial<T> => Object.entries(params).reduce((pv, [key, value]) => {
    if (value) {
        pv[key] = value
    }
    return pv
}, {})
