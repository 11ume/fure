/* eslint-disable no-useless-constructor */
import { FureOAuth2Provider, OAuth2ProviderOptions } from '../../'

/**
 * Dummy class for test an class whit a protected constructor.
 */
export class DummyFureOAuth2Provider extends FureOAuth2Provider {
    constructor(prodivder: string, authenticationUrl: string, options: OAuth2ProviderOptions) {
        super(prodivder, authenticationUrl, options)
    }

    /**
     * Only used for access to protected property.
     */
    get storage() {
        return this.store
    }

    /**
     * Only used for access to protected property.
     */
    get sessionTokenManager() {
        return this.uniqueSessionTokenManager
    }
}
