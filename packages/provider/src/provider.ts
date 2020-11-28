// must have a response, error logic
export class FureProvider {
    /**
     * Name of authentication provider entity.
     */
    protected readonly provider: string
    constructor(provider: string) {
        this.provider = provider
    }
}
