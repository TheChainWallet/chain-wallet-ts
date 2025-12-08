import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from '@solana/web3.js';
import {createHash} from 'crypto';
import * as nacl from "tweetnacl";

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
    return nacl.sign.detached(hash, keypair.secretKey);
}


export const uint8ArrayAlterFirst= (data:Uint8Array,replaceFirst: Uint8Array) => {
    data.set(replaceFirst,0)
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

export function toVersionTransaction(tx: Transaction,payer:PublicKey,recentBlockhash:string): VersionedTransaction {
    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: recentBlockhash,
        instructions: tx.instructions,
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
}