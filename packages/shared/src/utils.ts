import camelcase from 'camelcase'
import { ServerResponse } from 'http'
import { IStorage } from 'fure-storage'

const getParam = (param: string | string[]) => param ? (typeof param === 'string' ? param : param[0]) : null

export const isStore = (store: IStorage) => store.add && store.get && store.remove

export const getRequiredParam = (id: string, params: string | string[]) => {
    const param = getParam(params)
    if (param) return param
    throw new Error(`Param "${id}" is required`)
}

export const redirect = (res: ServerResponse, location: string) => {
    res.statusCode = 307
    res.setHeader('Location', location)
    res.end()
}

export const camelize = <T>(data: T) => {
    return Object.entries(data).reduce((pv, [key, value]) => {
        pv[camelcase(key)] = value
        return pv
    }, {})
}
