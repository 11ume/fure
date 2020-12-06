export interface IProfileParams {
    /**
     * API key. Your API key identifies your project and provides you with API access, quota, and reports.
     * Required unless you provide an OAuth 2.0 token.
     */
    key: string

    /**
     * OAuth 2.0 token for the current user.
     */
    oauth_token: string

    /**
     * Data format for the response.
     */
    alt?: 'json'

    /**
     * Selector specifying which fields to include in a partial response.
     */
    fields?: string

    /**
     * Returns response with indentations and line breaks.
     */
    prettyPrint?: boolean

    /**
     * An opaque string that represents a user for quota purposes. Must not exceed 40 characters.
     */
    quotaUser?: string
}

export interface IProfileResponse {
   email: string
   email_verified: boolean
   family_name: string
   given_name: string
   locale: string
   name: string
   picture: string
   sub: string
}
