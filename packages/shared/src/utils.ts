const getParam = (param: string | string[]) => param ? (typeof param === 'string' ? param : param[0]) : null

export const getRequiredParam = (id: string, params: string | string[]) => {
    const param = getParam(params)
    if (param) return param
    throw new Error(`Param "${id}" is required`)
}

export const deleteFalsyValues = <T>(params: T): Partial<T> => Object
    .entries(params)
    .reduce((pv, [key, value]) => {
        if (value || value === false) {
            pv[key] = value
        }
        return pv
    }, {})

export const hasBrowserCrypto = (): boolean => typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'

export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.document !== 'undefined'
