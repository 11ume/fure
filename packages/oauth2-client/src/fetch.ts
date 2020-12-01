import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
export { Response } from 'node-fetch'

export type Fetch = (url: RequestInfo, init?: RequestInit) => Promise<Response>

export const fetch = (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    return nodeFetch(url, init)
}
