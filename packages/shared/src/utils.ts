import camelcase from 'camelcase'

const getParam = (param: string | string[]) => param ? (typeof param === 'string' ? param : param[0]) : null

export const getRequiredParam = (id: string, params: string | string[]) => {
    const param = getParam(params)
    if (param) return param
    throw new Error(`Param "${id}" is required`)
}

export const toCamelcase = <T>(data: T): Partial<T> => Object
    .entries(data)
    .reduce((pv, [key, value]) => {
        pv[camelcase(key)] = value
        return pv
    }, {})

export const deleteEmptyValues = <T>(params: T): Partial<T> => Object
    .entries(params)
    .reduce((pv, [key, value]) => {
        if (value || value === false) {
            pv[key] = value
        }
        return pv
    }, {})

