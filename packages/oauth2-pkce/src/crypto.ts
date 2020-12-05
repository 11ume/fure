import crypto from 'crypto'

export interface Crypto {
    sign(privateKey: string, data: string | Buffer): string
    verify(pubkey: string, data: string | Buffer, signature: string): boolean
    randomBytesBase64(n: number): string
    sha256DigestBase64(str: string): string
    decodeBase64StringUtf8(base64: string): string
    encodeBase64StringUtf8(text: string): string
}

export class NodeCrypto implements Crypto {
    sign(privateKey: string, data: string | Buffer): string {
        const signer = crypto.createSign('RSA-SHA256')
        signer.update(data)
        signer.end()
        return signer.sign(privateKey, 'base64')
    }

    verify(pubkey: string, data: string | Buffer, signature: string) {
        const verifier = crypto.createVerify('sha256')
        verifier.update(data)
        verifier.end()
        return verifier.verify(pubkey, signature, 'base64')
    }

    sha256DigestBase64(str: string): string {
        return crypto
            .createHash('sha256')
            .update(str)
            .digest('base64')
    }

    randomBytesBase64(size: number): string {
        return crypto.randomBytes(size).toString('base64')
    }

    decodeBase64StringUtf8(base64: string): string {
        return Buffer.from(base64, 'base64').toString('utf-8')
    }

    encodeBase64StringUtf8(text: string): string {
        return Buffer.from(text, 'utf-8').toString('base64')
    }
}

export const createNodeCrypto = (): NodeCrypto => new NodeCrypto()
