import { Keypair, PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
export declare function getTransactionHashWithNonce(ins: TransactionInstruction, skip: number, nonce: bigint): Promise<Uint8Array>;
export declare function signHash32(hash: Uint8Array, keypair: Keypair): Uint8Array;
export declare const uint8ArrayAlterFirst: (data: Uint8Array, replaceFirst: Uint8Array) => void;
export declare function replaceWith<T>(array: T[], target: T, replacer: T, equalsFn?: (a: T, b: T) => boolean): void;
export declare function toVersionTransaction(tx: Transaction, payer: PublicKey, recentBlockhash: string): VersionedTransaction;
//# sourceMappingURL=utils.d.ts.map