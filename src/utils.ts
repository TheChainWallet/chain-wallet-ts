import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from '@solana/web3.js';
import * as nacl from "tweetnacl";

export async function getTransactionHashWithNonce(
    ins: TransactionInstruction,
    skip: number,
    nonce: bigint
): Promise<Uint8Array> {
    const chunks: Uint8Array[] = []
    // programId
    chunks.push(ins.programId.toBytes())

    // account metas
    ins.keys.forEach((account, index) => {
        if (index < skip) return

        const meta = new Uint8Array([
            account.isSigner ? 1 : 0,
            account.isWritable ? 1 : 0,
        ])
        chunks.push(meta)
        chunks.push(account.pubkey.toBytes())
    })

    // instruction data
    chunks.push(ins.data)

    // nonce (8-byte BE)
    const nonceBuf = new Uint8Array(8)
    const view = new DataView(nonceBuf.buffer)
    view.setBigUint64(0, nonce, false) // false = big-endian
    chunks.push(nonceBuf)

    // concat all
    const totalLen = chunks.reduce((s, x) => s + x.length, 0)
    const all = new Uint8Array(totalLen)
    let offset = 0
    for (const chunk of chunks) {
        all.set(chunk, offset)
        offset += chunk.length
    }

    // hash (browser or Node)
    if (typeof crypto !== "undefined" && crypto.subtle) {
        const digest = await crypto.subtle.digest("SHA-256", all);
        return new Uint8Array(digest);
    }

    // Node
    if (typeof process !== "undefined" && process.versions?.node) {
        // 动态导入 Node 内置 crypto
        const { createHash } = await import("crypto");
        const hash = createHash("sha256").update(all).digest();
        return new Uint8Array(hash);
    }
    throw new Error("No crypto available");
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