/* eslint-disable no-useless-constructor */
import { FureOAuth2Provider, IOAuth2Options, IOAuth2ProviderOptions } from '../..'

/**
 * Dummy class for test an class whit a protected constructor.
 */
export class FureOAuth2ProviderDummy extends FureOAuth2Provider {
    constructor(providerOptions: IOAuth2Options, options: IOAuth2ProviderOptions) {
        super(providerOptions, options)
    }
}
