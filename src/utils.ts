import { Keypair, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';
import { createHash } from 'crypto';
import { sign } from 'tweetnacl';
import naclUtil from "tweetnacl-util";

export function getTransactionHashWithNonce(
    ins: TransactionInstruction,
    skip: number,
    nonce: bigint
): Buffer {
    const hash = createHash('sha256');

    hash.update(ins.programId.toBytes());

    ins.keys.forEach((account, index) => {
        if (index < skip) {
            return;
        }
        const metaByte1 = account.isSigner ? 0x01 : 0x00;
        const metaByte2 = account.isWritable ? 0x01 : 0x00;

        hash.update(new Uint8Array([metaByte1, metaByte2]));
        hash.update(account.pubkey.toBytes());
    })

    hash.update(ins.data);


    const nonceBuffer = Buffer.alloc(8);
    const nonceBig = nonce;
    nonceBuffer.writeBigUInt64BE(nonceBig);
    hash.update(nonceBuffer);

    return hash.digest();
}


export function signHash32(hash: Uint8Array, keypair: Keypair): Uint8Array {
    if (hash.length !== 32) {
        throw new Error('Hash must be 32 bytes');
    }
    return sign.detached(hash, keypair.secretKey);
}


export const uint8ArrayAlterFirst= (data:Uint8Array,replaceFirst: Uint8Array) => {
    const len = Object.keys(data).length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        buf[i] = data[i];
    }

    // 2. 直接替换前 8 个字节
    buf.set(replaceFirst, 0);
    for (let i = 0; i < buf.length; i++) {
        data[i] = buf[i];
    }
}

export function replaceWith<T>(
    array: T[],
    target: T,
    replacer: T,
    equalsFn?: (a: T, b: T) => boolean
) {
    const eq = equalsFn || ((a: T, b: T) => a === b);

    for (let i = 0; i < array.length; i++) {
        if (eq(array[i], target)) {
            array[i] = replacer;
        }
    }
}