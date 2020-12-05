import { NodeCrypto } from './crypto'

export class Pkce {
    #crypto: NodeCrypto
    constructor(crypto: NodeCrypto) {
        this.#crypto = crypto
    }

    /**
     * Generate base64 encoded SHA256 string.
     */
    private generateBase64Encoded(codeVerifier: string): string {
        return this.#crypto.sha256DigestBase64(codeVerifier)
    }

    /**
     * The valid characters in the code_verifier are [A-Z]/[a-z]/[0-9]/
     * "-"/"."/"_"/"~".
     */
    private removeInvalidCharacters(randomBytesBase64: string) {
        return randomBytesBase64
            .replace(/\+/g, '~')
            .replace(/=/g, '_')
            .replace(/\//g, '-')
    }

    /**
     * Remove non Base64 URL encoding.
     */
    private converToBase64UrlEncoding(unencodedCodeChallenge: string) {
        return unencodedCodeChallenge
            .split('=')[0]
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
    }

    generateCodeVerifier() {
        const bytes = 96
        const randomString = this.#crypto.randomBytesBase64(bytes)
        const codeVerifier = this.removeInvalidCharacters(randomString)
        const unencodedCodeChallenge = this.generateBase64Encoded(codeVerifier)
        const codeChallenge = this.converToBase64UrlEncoding(unencodedCodeChallenge)
        return {
            codeVerifier
            , codeChallenge
        }
    }
}
