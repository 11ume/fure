import { RequestInit } from 'node-fetch'
export { RequestInit as RequestOptions } from 'node-fetch'

export type RequestClient = (url: string, options?: RequestInit) => Promise<Response>
