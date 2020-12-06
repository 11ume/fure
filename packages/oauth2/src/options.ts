export interface IGenerateAuthOptions {
    /**
     * Application ID.
     */
    client_id?: string

    /**
     * @required
     * Determines whether the response data included when the redirect back to the app occurs is in URL parameters or fragments. See the Confirming Identity section to choose which type your app should use.
     * This can be one of:
     * @value code - Response data is included as URL parameters and contains code parameter (an encrypted string unique to each login request). This is the default behavior if this parameter is not specified.
     * It's most useful when your server will be handling the token.
     * @value token - Response data is included as a URL fragment and contains an access token. Desktop apps must use this setting for response_type. This is most
     * useful when the client will be handling the token.
     */
    response_type?: string

    /**
     * @required
     * Determines where the API server redirects the user after the user completes
     * the authorization flow.
     */
    redirect_uri?: string

    /**
     * @required
     * A space-delimited list of scopes that identify the resources that your application
     * could access on the user's behalf. Scopes enable your application to only request access
     * to the resources that it needs while also enabling users to control the amount of access that
     * they grant to your application.
     */
    scope?: string[] | string

    /**
     * @recommended
     * A string value for maintain state between the request and callback.
     * This parameter should be used for preventing Cross-site Request Forgery and will be passed
     * back to you, unchanged, in your redirect URI.
     */
    state?: boolean
}

export interface IGetTokenOptions {
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
