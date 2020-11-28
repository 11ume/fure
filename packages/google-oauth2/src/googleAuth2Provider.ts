/* eslint-disable camelcase */
import {
    IFureOAuth2Provider
    , IGenerateAuthUrlOptions
    , AccessType
    , FureOAuth2Provider
    , OAuth2ProviderOptions
} from 'fure-oauth2'

type Prompt = 'none' | 'consent' | 'select_account'
type CodeChallengeMethod = 'plain' | 'S256'

interface IGoogleGenerateAuthUrlOptions extends IGenerateAuthUrlOptions {
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
     * Optional. Enables applications to use incremental authorization to request
     * access to additional scopes in context. If you set this parameter's value
     * to true and the authorization request is granted, then the new access token
     * will also cover any scopes to which the user previously granted the
     * application access. See the incremental authorization section for examples.
     */
    include_granted_scopes?: boolean

    /**
     * Optional. If your application knows which user is trying to authenticate,
     * it can use this parameter to provide a hint to the Google Authentication
     * Server. The server uses the hint to simplify the login flow either by
     * prefilling the email field in the sign-in form or by selecting the
     * appropriate multi-login session. Set the parameter value to an email
     * address or sub identifier, which is equivalent to the user's Google ID.
     */
    login_hint?: string

    /**
     * Optional. A space-delimited, case-sensitive list of prompts to present the
     * user. If you don't specify this parameter, the user will be prompted only
     * the first time your app requests access.
     * Possible values are:
     * @value none - Donot display any authentication or consent screens. Must not be specified with other values.
     * @value consent - the user for consent.
     * @value select_account - Prompt the user to select an account.
     */
    prompt?: Prompt

    /**
     * Recommended. Specifies what method was used to encode a 'code_verifier'
     * that will be used during authorization code exchange. This parameter must
     * be used with the 'code_challenge' parameter. The value of the
     * 'code_challenge_method' defaults to "plain" if not present in the request
     * that includes a 'code_challenge'. The only supported values for this
     * parameter are "S256" or "plain".
     */
    code_challenge_method?: CodeChallengeMethod

    /**
     * Recommended. Specifies an encoded 'code_verifier' that will be used as a
     * server-side challenge during authorization code exchange. This parameter
     * must be used with the 'code_challenge' parameter described above.
     */
    code_challenge?: string
}

export interface GoogleOAuth2ProviderOptions extends OAuth2ProviderOptions {
    readonly prompt?: Prompt
    readonly accessType?: AccessType
}

export class FureGoogleOAuth2Provider extends FureOAuth2Provider implements IFureOAuth2Provider {
    readonly prompt: Prompt
    readonly accessType: AccessType
    constructor({
        scope = ['openid', 'email', 'profile']
        , state = false
        , prompt = null
        , accessType = 'offline'
        , store
        , oAuth2Client
        , uniqueSessionTokenManager
    }: GoogleOAuth2ProviderOptions) {
        super('google', {
            scope
            , state
            , store
            , oAuth2Client
            , uniqueSessionTokenManager
        })
        this.prompt = prompt
        this.accessType = accessType
    }

    private checkParamChallange(codeChallengeMethod: string, codeChallenge: string): void {
        if (codeChallengeMethod && !codeChallenge) {
            throw new Error('If a code_challenge_method is provided, code_challenge must be included.')
        }
    }

    /**
     * Generate URI for consent page landing.
     * @return URI to consent page.
     */
    generateAuthUrl(options: IGoogleGenerateAuthUrlOptions = {}): string {
        const redirectUri = options.redirect_uri ?? this.oAuth2Client.redirectUri
        const responseType = options.response_type ?? 'code'
        const params = {
            scope: this.scope
            , redirect_uri: redirectUri
            , response_type: responseType
        }

        this.checkParamChallange(options.code_challenge_method, options.code_challenge)
        return this.oAuth2Client.generateAuthUrl(params)
    }

    /**
     * Method used for parse the returned URI after an succes authentication in the consent page,
     * then a request is made with part of the parameters extracted from the returned URI.
     * @return user information, this can varies depending of the "scope" parameter.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callbackHandler() { }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    revokeToken() { }
}

