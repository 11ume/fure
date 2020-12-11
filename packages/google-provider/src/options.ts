import { IGenerateAuthUrlOptions, IGenerateAuthUrlParams } from 'fure-oauth2'

export enum Prompt {
    none = 'none'
    , consent = 'consent'
    , selectAccount = 'select_account'
}

export enum AccessType {
    online = 'online'
    , offline = 'offline'
}

export enum ResponseType {
    code = 'code'
    , codeToken = 'code_token'
}

export enum CodeChallengeMethod {
    S256 = 'S256'
}

export interface IGoogleGenerateAuthUrlOptions extends IGenerateAuthUrlOptions {

    /**
     * The hd (hosted domain) parameter streamlines the login process for G Suite
     * hosted accounts. By including the domain of the G Suite user (for example,
     * mycollege.edu), you can indicate that the account selection UI should be
     * optimized for accounts at that domain. To optimize for G Suite accounts
     * generally instead of just one domain, use an asterisk: hd=*.
     * Don't rely on this UI optimization to control who can access your app,
     * as client-side requests can be modified. Be sure to validate that the
     * returned ID token has an hd claim value that matches what you expect
     * (e.g. mycolledge.edu). Unlike the request parameter, the ID token claim is
     * contained within a security token from Google, so the value can be trusted.
     */
    hd?: string

    /**
     * @recommended
     * Indicates whether your application can refresh access tokens
     * when the user is not present at the browser. Valid parameter values are
     * 'online', which is the default value, and 'offline'. Set the value to
     * 'offline' if your application needs to refresh access tokens when the user
     * is not present at the browser. This value instructs the Google
     * authorization server to return a refresh token and an access token the
     * first time that your application exchanges an authorization code for
     * tokens.
     */
    accessType?: AccessType

    /**
     * Enables applications to use incremental authorization to request
     * access to additional scopes in context. If you set this parameter's value
     * to true and the authorization request is granted, then the new access token
     * will also cover any scopes to which the user previously granted the
     * application access.
     * See the incremental authorization section.
     * @link https://developers.google.com/identity/protocols/oauth2/web-server#incrementalAuth
     */
    includeGrantedScopes?: boolean

    /**
     * When your app knows which user it is trying to authenticate, it can provide this parameter as a hint to the authentication server. Passing this hint suppresses the account chooser,
     * either pre-fills the email box on the sign-in form, or selects the proper session (if the user is using multiple sign-in), which can help you avoid problems
     * that occur if your app logs in the wrong user account. The value can be either an email address or the sub
     * string, which is equivalent to the user's Google ID.
     */
    loginHint?: string

    /**
     * A space-delimited, case-sensitive list of prompts to present the user. If you don't specify
     * this parameter, the user will be prompted only the first time your app requests access.
     * Possible values are:
     * @value none - The authorization server does not display any authentication or user consent screens; it will return an error if the user is not already authenticated and has not pre-configured consent for the requested scopes.
     * You can use none to check for existing authentication and/or consent.
     * @value consent - The authorization server prompts the user for consent before returning information to the client.
     * @value select_account - The authorization server prompts the user to select a user account. This allows a user who has multiple accounts at the authorization server
     * to select amongst the multiple accounts that they may have current sessions for.
     * If no value is specified and the user has not previously authorized access, then the user is shown a consent screen.
     */
    prompt?: Prompt

    /**
     * @recommended
     * Specifies what method was used to encode a 'code_verifier' that will be used during authorization code
     * exchange. This parameter must be used with the 'code_challenge' parameter. The value of the 'code_challenge_method'
     * defaults to "plain" if not present in the request that includes a 'code_challenge'.
     */
    codeChallengeMethod?: CodeChallengeMethod

    /**
     * @recommended
     * Specifies an encoded 'code_verifier' that will be used as a server-side challenge during authorization code exchange. This parameter
     * must be used with the 'code_challenge' parameter described above.
     */
    codeChallenge?: boolean
}

export interface IGoogleGenerateAuthUrlParams extends IGenerateAuthUrlParams {
    hd?: string
    prompt?: Prompt
    login_hint?: string
    access_type?: AccessType
    code_challenge?: boolean
    code_challenge_method?: CodeChallengeMethod
    include_granted_scopes?: boolean
}
