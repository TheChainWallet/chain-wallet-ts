import { Keypair, PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
/**
 * Generate a SHA-256 hash of a TransactionInstruction for multisig signing.
 *
 * This function computes a deterministic hash of a `TransactionInstruction`
 * by concatenating the following elements in order:
 * 1. Program ID (`programId.toBytes()`)
 * 2. Account metas (isSigner, isWritable flags + pubkey)
 *    - Optionally skip the first `skip` accounts
 * 3. Instruction data (`ins.data`)
 * 4. Nonce (8-byte big-endian representation)
 *
 * The resulting hash can be signed off-chain by wallet managers or executors
 * as part of a multisig workflow.
 *
 * ## Notes
 *
 * - `skip` allows ignoring the first N accounts in the instruction when hashing.
 * - The `nonce` ensures each instruction has a unique hash for multisig.
 * - The function works both in browser (Web Crypto API) and Node.js (crypto module).
 * - The hash is always a 32-byte SHA-256 digest returned as `Uint8Array`.
 *
 * @param ins - The `TransactionInstruction` to hash
 * @param skip - Number of leading accounts to skip in the hash computation
 * @param nonce - A unique nonce to include in the hash (8-byte big-endian)
 *
 * @returns A 32-byte SHA-256 hash of the instruction + nonce as `Uint8Array`
 *
 * @example
 * ```ts
 * const instruction: TransactionInstruction = ...;
 * const nonce = 123n;
 * const hash = await getTransactionHashWithNonce(instruction, 0, nonce);
 *
 * // Now hash can be signed off-chain by wallet managers for multisig approval
 * const signature = manager.signMessage(hash);
 * ```
 */
export declare function getTransactionHashWithNonce(ins: TransactionInstruction, skip: number, nonce: bigint): Promise<Uint8Array>;
/**
 * Generate the hash for a meta-transaction.
 *
 * This hash **must be signed off-chain** by the signer (`singer`)
 * and later passed into {@link metaInstruction}.
 *
 * The hash includes:
 * - instruction data
 * - executor address
 * - nonce / skip value
 * - expiration timestamp
 *
 * ### Security
 * - Prevents replay attacks
 * - Binds the signature to a specific executor and time window
 *
 * @param ins - Original instruction to be executed via meta-transaction
 * @param skip - Nonce or sequence value to prevent duplicate execution
 * @param executor - Account that will submit the transaction on-chain
 * @param timestamp - Expiration timestamp (unix seconds)
 *
 * @returns Hash bytes that should be signed by the signer
 */
export declare function getMetaTransactionHash(ins: TransactionInstruction, skip: number, executor: PublicKey, expireAt: bigint): Promise<Uint8Array>;
export declare function signHash32(hash: Uint8Array, keypair: Keypair): Uint8Array;
export declare const uint8ArrayAlterFirst: (data: Uint8Array, replaceFirst: Uint8Array) => void;
export declare function replaceWith<T>(array: T[], target: T, replacer: T, equalsFn?: (a: T, b: T) => boolean): void;
export declare function toVersionTransaction(tx: Transaction, payer: PublicKey, recentBlockhash: string): VersionedTransaction;
//# sourceMappingURL=utils.d.ts.map