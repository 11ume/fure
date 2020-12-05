/* eslint-disable camelcase */

export interface TokenRequestValues {
  /**
   * He authorization code returned from the initial request
   */
  code: string

  /**
  * Application ID.
  */
  client_id: string

  /**
   * Application unique secret key.
   */
  client_secret: string

  /**
   * Is a high-entropy cryptographic random string using the unreserved characters.
   */
  code_verifier: string

  /**
   * One of the redirect URIs listed for your project for the given client_id.
   */
  redirect_uri: string

  /**
   * As defined in the OAuth 2.0 specification, this field's value must be set to authorization_code.
   */
  grant_type: string
}

export interface TokenCredentials {
  /**
   * The scopes of access granted by the access_token expressed as a list of space-delimited, case-sensitive strings.
   */
  scope?: string

  /**
   * Contains identity information about the user that is digitally signed by Google.
   */
  id_token?: string

  /**
   * Identifies the type of token returned. At this time, this field always has the value Bearer.
   */
  token_type?: string

  /**
   * The time in ms at which this token is thought to expire.
   */
  expires_in?: number

  /**
   * This field is only present if the access_type parameter was set to offline in the authentication request.
   * For details, see Refresh tokens.
   */
  refresh_token?: string

  /**
   * A token that can be sent to a Google API.
   */
  access_token?: string
}

export interface TokenCredentialsError {
  /**
   * Error message.
   */
  error?: string

  /**
   * Error description message.
   */
  error_description?: string
}
