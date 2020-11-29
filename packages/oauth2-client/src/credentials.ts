export interface Credentials {
    /**
     * This field is only present if the access_type parameter was set to offline in the authentication request. For details, see Refresh tokens.
     */
    refreshToken?: string | null
    /**
     * The time in ms at which this token is thought to expire.
     */
    expiryDate?: number | null
    /**
     * A token that can be sent to a Google API.
     */
    accessToken?: string | null
    /**
     * Identifies the type of token returned. At this time, this field always has the value Bearer.
     */
    tokenType?: string | null
    /**
     * A JWT that contains identity information about the user that is digitally signed by Google.
     */
    idToken?: string | null
    /**
     * The scopes of access granted by the access_token expressed as a list of space-delimited, case-sensitive strings.
     */
    scope?: string
  }
