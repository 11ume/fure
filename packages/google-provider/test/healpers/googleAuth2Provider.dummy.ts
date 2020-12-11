import { FureGoogleOAuth2Provider } from '../../'

export class FureOAuth2GoogleProviderDummy extends FureGoogleOAuth2Provider {
    public checkIfTokenIsExpired(expiryDate: number, anticipationTime?: number): boolean {
        return this.checkTokenExpiryDate(expiryDate, anticipationTime)
    }
}
