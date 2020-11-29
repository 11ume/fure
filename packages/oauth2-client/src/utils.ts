export const deleteEmptyValues = <T>(params: T): Partial<T> => Object.entries(params).reduce((pv, [key, value]) => {
    if (value || value === false) {
        pv[key] = value
    }
    return pv
}, {})
