export interface ITokenGetTokenParams {
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

export interface ITokenRefreshParams {
  client_id: string
  client_secret: string
  grant_type: string
  refresh_token: string
}

export interface ITokenCredentials {
  /**
   * The scopes of access granted by the access_token expressed as a list of space-delimited, case-sensitive strings.
   */
  scope?: string

  /**
   * Contains identity information about the user that is digitally signed by OAuth 2.0 provider.
   * Note: This property is only returned if your request included an identity scope, such as openid, profile, or email.
   * That value is a JSON Web Token (JWT) that contains digitally signed identity information about the user.
   */
  id_token?: string

  /**
   * Identifies the type of token returned. At this time, this field always has the value Bearer.
   */
  token_type?: string

  /**
   * The remaining lifetime of the access token in seconds.
   */
  expires_in?: number

  /**
   * This field is only present if the access_type parameter was set to offline in the first authentication request.
   */
  refresh_token?: string

  /**
   * The token that your application sends to authorize a OAuth 2.0 provider API request.
   */
  access_token?: string
}

export interface ITokenGetOptions {
  /**
   * Application ID.
   */
  clientId?: string

  /**
   * The URI that you want to redirect the user logging in back to.
   */
  redirectUri?: string

  /**
   * Is a high-entropy cryptographic random string using the unreserved characters.
   */
  codeVerifier?: string
}
