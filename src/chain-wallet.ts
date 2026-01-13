import {AnchorProvider, Instruction, Program} from "@coral-xyz/anchor";
import BN from 'bn.js'
import {ChainWallet} from "./idl/chain_wallet";
import {ACCOUNT_SEED, AccountStatus, DEFAULT_NET_WORK, getDefaultEndpoint, NET_WORK} from "./constansts";
import {
    ConfirmOptions,
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction
} from "@solana/web3.js";
import devWalletIdl from './idl/devnet/chain_wallet.json';
// import testWalletIdl from '../../packages/idl/test/idl/chain_wallet.json';
import mainWalletIdl from './idl/mainnet/chain_wallet.json';
import {Rule} from "./rule-type";
import {getMetaTransactionHash, getTransactionHashWithNonce, toVersionTransaction, uint8ArrayAlterFirst} from "./utils";
import {assertTrue, NotSupportError, ValidationError} from "./error";

export class ChainWalletClient {

    public walletProgram: Program<ChainWallet>;


    private provider: AnchorProvider;

    public connect: Connection;

    private delayExecuteDiscriminator;

    private executeDiscriminator;

    constructor(opt?: ChainWalletClientInitType) {
        let network = DEFAULT_NET_WORK;
        if (opt?.network) {
            network = opt?.network;
        }
        let endpoint = getDefaultEndpoint(network);
        if (opt?.endpoint) {
            endpoint = opt.endpoint;
        }
        const connect = new Connection(endpoint);

        this.connect = connect;

        this.provider = new AnchorProvider(connect, dummyWallet, opt?.confirmOptions);

        switch (network) {
            case 'Devnet':
                this.walletProgram = new Program(devWalletIdl as ChainWallet, this.provider);
                break;
            case "Testnet":
                throw new NotSupportError("not supported testnet")
            case "Mainnet":
                this.walletProgram = new Program(mainWalletIdl as ChainWallet, this.provider);
                break;
        }
        const delayExecuteDiscriminator = this.walletProgram.coder.instruction.encode("delayExecute", []);
        this.delayExecuteDiscriminator = Uint8Array.from(delayExecuteDiscriminator);

        const executeDiscriminator = this.walletProgram.coder.instruction.encode("execute", []);
        this.executeDiscriminator = Uint8Array.from(executeDiscriminator);
    }

    public async executorTxConvert(tx: Transaction, wallet: PublicKey, executor: PublicKey): Promise<Transaction> {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let ins of instructions) {
            if (ins.keys.filter(d => d.pubkey.equals(wallet) && d.isSigner)) {
                const newKeys = ins.keys.map(k => {
                    if (k.pubkey.equals(wallet)) {
                        return {
                            ...k,
                            isSigner: false
                        };
                    }
                    return k;
                });
                const insNew = await this.walletProgram.methods
                    .execute(ins.data)
                    .accounts({
                        executor: executor,
                        custodyAccount: walletDataPubkey,
                        proxyProgram: ins.programId
                    })
                    .remainingAccounts(newKeys).instruction();
                txNew.add(insNew);
            } else {
                txNew.add(ins);
            }
        }

        return txNew;
    }

    public findWalletDataPubkeyByWallet(wallet: PublicKey): PublicKey {
        const seedBytes = new TextEncoder().encode(ACCOUNT_SEED)

        const [walletDataPubkey, _] = PublicKey.findProgramAddressSync(
            [seedBytes, wallet.toBytes()],
            this.walletProgram.programId
        )

        return walletDataPubkey
    }
    /**
     * Create a new on-chain wallet.
     *
     * This method builds a transaction that:
     * - derives a new wallet PDA using a timestamp-based nonce
     * - transfers rent-exempt lamports to the wallet account
     * - initializes wallet configuration such as threshold, executors, and admins
     *
     * ## Wallet Address Derivation
     *
     * The wallet address is derived as a Program Derived Address (PDA) using:
     * - a static seed: `"wallet"`
     * - a nonce generated from the current timestamp
     *
     * ## Notes
     * - The returned transaction is **not signed**
     * - The caller is responsible for signing and sending the transaction
     *
     * @param name - Human-readable wallet name
     * @param user - Wallet creator and initial owner
     * @param threshold - Number of required approvals to execute a transaction
     * @param executors - Accounts allowed to execute transactions
     * @param userAdmins - Accounts with administrative permissions
     *
     * @param nonce
     * @returns A `Transaction` that creates and initializes the wallet
     *
     * @example
     * ```ts
     * const tx = await walletClient.createWallet(
     *   "My Wallet",
     *   user.publicKey,
     *   2,
     *   [executor1.publicKey, executor2.publicKey],
     *   [admin.publicKey],
     * );
     *
     * await sendAndConfirmTransaction(connection, tx, [user]);
     * ```
     */
    public async createWallet(
        name: string,
        user: PublicKey,
        threshold: number,
        executors: PublicKey[],
        userAdmins: PublicKey[],
        nonce?: number
    ): Promise<Transaction> {
        if (!nonce) {
            nonce = new Date().getTime();
        }
        const nonceSeed = new Uint8Array(8)
        const view = new DataView(nonceSeed.buffer)
        view.setBigUint64(0, BigInt(nonce), true) // true = little-endian

        const walletSeed = new TextEncoder().encode("wallet")


        const [wallet, _] = PublicKey.findProgramAddressSync(
            [walletSeed, nonceSeed],
            this.walletProgram.programId
        )
        const remainingAccounts: { isSigner: boolean, isWritable: boolean, pubkey: PublicKey }[] = [];
        executors.forEach(d => {
            remainingAccounts.push({isSigner: false, isWritable: false, pubkey: d})
        });
        userAdmins.forEach(d => {
            remainingAccounts.push({isSigner: false, isWritable: false, pubkey: d})
        })
        const createIns = await this.walletProgram.methods.create({
            nonce: new BN(nonce),
            status: {normal: {}},
            threshold: threshold,
            executorNum: executors.length,
            userAdminsNum: userAdmins.length,
            enableAutoLock: true,
            name: name
        }).accounts({
            user: user,
            custodyAccount: this.findWalletDataPubkeyByWallet(wallet),
        }).remainingAccounts(remainingAccounts)
            .instruction();

        const createTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: user,
                toPubkey: wallet,
                lamports: await this.connect.getMinimumBalanceForRentExemption(0, "processed")
            }),
            createIns
        );
        return createTx;
    }


    /**
     * Execute a transaction using manager approvals.
     *
     * This method processes an existing transaction and replaces instructions
     * that have collected off-chain signatures with multisig approval instructions.
     * The returned transaction can then be submitted on-chain by the manager.
     *
     * ## How It Works
     *
     * - Iterates over each instruction in the transaction
     * - If there are manager signatures for the instruction:
     *   - Prepares approval parameters (data, signatures, nonce)
     *   - Injects manager public keys into the instruction's accounts
     *   - Wraps the instruction using the wallet program's `approval` method
     * - Otherwise, keeps the instruction unchanged
     * - Combines all instructions into a new transaction
     *
     * ## Notes
     *
     * - Instruction order is preserved
     * - Signatures are applied in reverse order to match account layout
     * - The returned transaction is **not signed**
     * - Requires that `pubkeyAndHashs` contains correct signatures collected off-chain
     *
     * ## Typical Flow
     *
     * 1. Convert instructions using {convertToMultiSigTx} to get hashes
     * 2. Managers sign the hashes off-chain
     * 3. Build `pubkeyAndHashs` array containing signatures and nonces
     * 4. Call this method to inject signatures and generate the final transaction
     *
     * @param tx - Original transaction containing instructions
     * @param wallet - Wallet public key that owns the custody account
     * @param manager - Manager submitting the transaction
     * @param pubkeyAndHashs - Array of collected signatures with instruction indexes and nonces
     *
     * @returns A new `Transaction` with approval instructions injected
     *
     * @example
     * ```ts
     * // Convert instructions and get hashes
     * const { tx: convertedTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   originalTx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // Managers sign each hash
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // Build the executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   convertedTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // Submit on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerExecuteTx(
        tx: Transaction,
        wallet: PublicKey,
        manager: PublicKey,
        pubkeyAndHashs: TransactionInstructionSignatureType[],
    ) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let [index, ins] of instructions.entries()) {
            if (pubkeyAndHashs.find(item => item.instructionIndex == index)) {
                const transactionInstructionSignature = pubkeyAndHashs.find(item => item.instructionIndex == index);
                const approvalParams = {
                    data: ins.data,
                    hashs: transactionInstructionSignature!.signatures.map(item => Array.from(item.signature)),
                    nonce: new BN(transactionInstructionSignature!.nonce),
                };
                if(ins.programId.toString() == this.walletProgram.programId.toString()) {
                    ins.keys[0].pubkey = manager;
                }
                let signatures = transactionInstructionSignature?.signatures;
                signatures?.reverse();
                signatures?.forEach(d => {
                    ins.keys.unshift(
                        {
                            pubkey: d.singer,
                            isSigner: false,
                            isWritable: true
                        }
                    )
                });
                const insNew = await this.walletProgram.methods
                    .approval(approvalParams)
                    .accounts({
                        user: manager,
                        custodyAccount: walletDataPubkey,
                        proxyProgram: this.walletProgram.programId,
                    })
                    .remainingAccounts(ins.keys).instruction();
                txNew.add(insNew);
            } else {
                txNew.add(ins);
            }
        }
        return txNew;
    }

    /**
     * Convert a normal instruction into a multisig approval instruction
     * and generate its signing hash.
     *
     * This method is used as an intermediate step in the multisig flow.
     * It wraps the original instruction with an `approval` call and
     * computes the hash that managers must sign off-chain.
     *
     * ## Usage
     *
     * This method should be called **before collecting manager signatures**.
     * The returned hash is signed by managers and later consumed by
     * {@link managerExecuteTx}.
     *
     * ## Notes
     *
     * - No signatures are attached at this stage
     * - The returned instruction is not executable by itself
     *
     * @param instruction - Original instruction to be executed via multisig
     * @param wallet - Wallet public key that owns the custody account
     * @param nonce - Nonce used for replay protection
     *
     * @returns An object containing:
     * - `instruction`: the wrapped multisig approval instruction
     * - `hash`: the hash that managers must sign
     *
     * @example
     * ```ts
     * const { instruction, hash } =
     *   await walletClient.convertToMultiSigInstruction(
     *     originalInstruction,
     *     walletPublicKey,
     *     nonce,
     *   );
     *
     * const signature = manager.signMessage(hash);
     * ```
     */
    public async convertToMultiSigInstruction(
        instruction: TransactionInstruction,
        wallet: PublicKey,
        nonce: number
    ): Promise<InstructionWithHash> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const approvalParams = {
            data: instruction.data,
            hashs: [],
            nonce: new BN(nonce),
        };
        const ins = await this.walletProgram.methods
            .approval(approvalParams)
            .accounts({
                user: wallet,
                custodyAccount: walletDataPubkey,
                proxyProgram: this.walletProgram.programId,
            })
            .remainingAccounts(instruction.keys).instruction();
        const hash = await getTransactionHashWithNonce(ins, 0, BigInt(nonce));
        return {
            instruction: ins,
            hash: hash,
        }
    }

    /**
     * Convert eligible instructions in a transaction to multisig approval instructions.
     *
     * This method scans all instructions in a given transaction, and for each instruction
     * where the wallet is a signer, it wraps the instruction with a multisig approval call
     * and computes its signing hash.
     *
     * The resulting transaction contains the same instructions, but with eligible instructions
     * replaced by approval-wrapped instructions. The corresponding hashes and their instruction
     * indexes are returned to be signed by managers off-chain.
     *
     * ## Usage Flow
     *
     * 1. Call this method to convert instructions in a transaction for multisig approval.
     * 2. Collect the returned hashes and have managers sign them off-chain.
     * 3. Use the signatures in `managerExecuteTx` to create the final executable transaction.
     *
     * ## Notes
     *
     * - Instructions are checked for `wallet` as a signer
     * - Nonce is incremented for each converted instruction
     * - The returned transaction is **not signed**
     *
     * @param tx - The original transaction containing instructions
     * @param wallet - Wallet public key that owns the custody account and is a signer
     * @param nonce - Starting nonce for generating multisig hashes
     *
     * @returns An object containing:
     * - `tx`: the transaction with converted multisig instructions
     * - `hashIndexes`: array of hashes and their corresponding instruction indexes
     *
     * @example
     * ```ts
     * // The nonce you can get on chain or on backend
     * const nonce = 1;
     *
     * // Convert eligible instructions to multisig
     * const { tx: convertedTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   originalTx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // Managers sign each hash
     * const signedApprovals = hashIndexes.map(h =>
     *   ({
     *     transactionIndex: h.transactionIndex,
     *     nonce,
     *     signatures: [
     *       { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *       { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *     ],
     *   })
     * );
     *
     * // Execute the transaction with manager approvals
     * const approvedTx = await walletClient.managerExecuteTx(
     *   convertedTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   signedApprovals
     * );
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async convertToMultiSigTx(
        tx: Transaction,
        wallet: PublicKey,
        nonce: number
    ): Promise<{
        tx: Transaction,
        hashIndexes: InstructionIndexWithHash[]
    }> {
        const hashIndexes: InstructionIndexWithHash[] = [];
        for (let [index, instruction] of tx.instructions.entries()) {
            if (instruction.keys.find(item => item.pubkey.equals(wallet) && item.isSigner)) {
                const instructionWithHash = await this.convertToMultiSigInstruction(instruction, wallet, nonce);
                instruction = instructionWithHash.instruction
                nonce++;
                hashIndexes.push({hash: instructionWithHash.hash, transactionIndex: index})
            }
        }
        return {
            tx: tx,
            hashIndexes: hashIndexes,
        }
    }

    /**
     * Generate a transaction instruction to delete one or more wallet executors (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to remove specified executors from the wallet. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the delete instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only the wallet manager can remove executors.
     * - `executorIndexs` correspond to the indexes of executors in the wallet's executor list.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the deletion
     * @param executorIndexs - Array of indexes of executors to remove
     *
     * @returns A `TransactionInstruction` to delete the specified executors (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the delete executor instruction
     * const deleteIns = await walletClient.managerExecutorDeleteInstruction(
     *   walletPublicKey,
     *   [0, 2] // remove first and third executor
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(deleteIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerExecutorDeleteInstruction(wallet: PublicKey, executorIndexs: number[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorDelete(executorIndexs)
            .accounts({
                user: wallet,
                wallet:wallet,
                custodyAccount: walletDataPubkey
            }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }


    /**
     * Generate a transaction instruction to add one or more wallet executors (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to add new executors to the wallet. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the add executor instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only the wallet manager can add executors.
     * - The instruction includes the executor public keys in `remainingAccounts`.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the addition
     * @param manger
     * @param executorPublicKeys - Array of new executor public keys to add
     *
     * @returns A `TransactionInstruction` to add the specified executors (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the add executor instruction
     * const addIns = await walletClient.managerExecutorAddInstruction(
     *   walletPublicKey,
     *   [executor1.publicKey, executor2.publicKey]
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(addIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerExecutorAddInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorAdd({
                executorNum: executorPublicKeys.length
            })
            .accounts({
                user: wallet,
                wallet:wallet,
                custodyAccount: walletDataPubkey
            }).remainingAccounts(
                executorPublicKeys.map(d => {
                        return {isSigner: false, isWritable: false, pubkey: d}
                    }
                )
            ).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }


    /**
     * Generate a transaction instruction to replace the wallet executors (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to replace the current executor list with the specified new executors.
     * The instruction is returned **not signed** and must be processed through
     * the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the replace executor instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only the wallet manager can replace executors.
     * - The instruction includes the new executor public keys in `remainingAccounts`.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the replacement
     * @param executorPublicKeys - Array of new executor public keys to replace the current list
     *
     * @returns A `TransactionInstruction` to replace the wallet's executors (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the replace executor instruction
     * const replaceIns = await walletClient.managerExecutorReplaceInstruction(
     *   walletPublicKey,
     *   [executor1.publicKey, executor2.publicKey]
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(replaceIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */

    public async managerExecutorReplaceInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorChange({
                executorNum: executorPublicKeys.length
            })
            .accounts({
                user: wallet,
                wallet:wallet,
                custodyAccount: walletDataPubkey
            }).remainingAccounts(
                executorPublicKeys.map(d => {
                        return {isSigner: false, isWritable: false, pubkey: d}
                    }
                )
            ).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }


    /**
     * Generate a transaction instruction to delete one or more wallet managers (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to remove specified managers from the wallet. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the delete manager instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for the existing managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only existing wallet managers can remove other managers.
     * - The `managerIndexs` correspond to the indexes of managers in the wallet's manager list.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the deletion
     * @param managerIndexs - Array of indexes of managers to remove
     *
     * @returns A `TransactionInstruction` to delete the specified managers (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the delete manager instruction
     * const deleteIns = await walletClient.managerMangersDeleteInstruction(
     *   walletPublicKey,
     *   [0, 2] // remove first and third manager
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(deleteIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerMangersDeleteInstruction(wallet: PublicKey, managerIndexs: number[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerDelete(managerIndexs)
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }


    /**
     * Generate a transaction instruction to add one or more wallet managers (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to add new managers to the wallet. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the add manager instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for existing managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only existing wallet managers can add new managers.
     * - The instruction includes the new manager public keys in `remainingAccounts`.
     * - The returned instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Public key of the wallet (manager) performing the addition
     * @param managerPublicKeys - Array of new manager public keys to add
     *
     * @returns A `TransactionInstruction` to add the specified managers (unsigned)
     *
     * @example
     * ```ts
     * // 1. Generate the add manager instruction
     * const addIns = await walletClient.managerMangersAddInstruction(
     *   walletPublicKey,
     *   [manager1.publicKey, manager2.publicKey]
     * );
     *
     * // 2. Build a temporary transaction with this instruction
     * const tx = new Transaction().add(addIns);
     *
     * // 3. Convert to multisig transaction to generate signing hashes
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(
     *   tx,
     *   walletPublicKey,
     *   nonce
     * );
     *
     * // 4. Managers sign the hashes off-chain
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: existingManager1.publicKey, signature: existingManager1.signMessage(h.hash) },
     *     { signer: existingManager2.publicKey, signature: existingManager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * // 5. Inject signatures and produce executable transaction
     * const approvedTx = await walletClient.managerExecuteTx(
     *   multiSigTx,
     *   walletPublicKey,
     *   submittingManager.publicKey,
     *   pubkeyAndHashs
     * );
     *
     * // 6. Submit the transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerMangersAddInstruction(wallet: PublicKey, managerPublicKeys: PublicKey[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerAdd({
                managerNum: managerPublicKeys.length
            })
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).remainingAccounts(
                managerPublicKeys.map(d => {
                        return {isSigner: false, isWritable: false, pubkey: d}
                    }
                )
            ).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }


    /**
     * Generate a transaction instruction to replace wallet managers (multisig flow).
     *
     * This method creates a `TransactionInstruction` for the wallet program
     * to replace the current manager list with the specified new managers.
     * The instruction is returned **not signed** and must be processed
     * through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the replace manager instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce the final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only existing managers can replace the manager list.
     * - The new managers are included in `remainingAccounts`.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the replacement
     * @param managerPublicKeys - Array of new manager public keys
     *
     * @returns A `TransactionInstruction` to replace managers (unsigned)
     *
     * @example
     * ```ts
     * const replaceIns = await walletClient.managerMangersReplaceInstruction(
     *   walletPublicKey,
     *   [manager1.publicKey, manager2.publicKey]
     * );
     *
     * const tx = new Transaction().add(replaceIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: existingManager1.publicKey, signature: existingManager1.signMessage(h.hash) },
     *     { signer: existingManager2.publicKey, signature: existingManager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerMangersReplaceInstruction(wallet: PublicKey, managerPublicKeys: PublicKey[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerChange({
                managerNum: managerPublicKeys.length
            })
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).remainingAccounts(
                managerPublicKeys.map(d => {
                        return {isSigner: false, isWritable: false, pubkey: d}
                    }
                )
            ).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }

    /**
     * Generate a transaction instruction to change wallet multisig threshold (multisig flow).
     *
     * This method creates a `TransactionInstruction` for changing the wallet's
     * approval threshold. The instruction is returned **not signed** and must
     * be processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the threshold change instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can change the threshold.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the change
     * @param threshold - New threshold value for approvals
     *
     * @returns A `TransactionInstruction` to change the threshold (unsigned)
     *
     * @example
     * ```ts
     * const thresholdIns = await walletClient.managerChangeThresholdInstruction(walletPublicKey, 2);
     * const tx = new Transaction().add(thresholdIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerChangeThresholdInstruction(wallet: PublicKey, threshold: number): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .thresholdChange(threshold)
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }

    /**
     * Generate a transaction instruction to change wallet account status (multisig flow).
     *
     * This method creates a `TransactionInstruction` for changing the wallet's
     * status (e.g., normal, frozen). The instruction is returned **not signed**
     * and must be processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the status change instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can change the account status.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the status change
     * @param status - New account status
     *
     * @returns A `TransactionInstruction` to change the wallet status (unsigned)
     *
     * @example
     * ```ts
     * const statusIns = await walletClient.managerChangeStatusInstruction(walletPublicKey, { normal: {} });
     * const tx = new Transaction().add(statusIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerChangeStatusInstruction(wallet: PublicKey, status: AccountStatus): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .statusChange({
                status: status
            } as any)
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }

    /**
     * Mark the wallet-related keys in a TransactionInstruction as unsigned.
     *
     * This method is used internally to modify a `TransactionInstruction` so that
     * the wallet's own keys (`wallet` and `walletDataPubkey`) are temporarily
     * marked with `isSigner = false`. This is necessary for the multisig flow,
     * allowing the instruction to be sent to the chain without requiring the
     * wallet's on-chain signature at this stage.
     *
     * The on-chain wallet program will internally restore the signer flags
     * (`isSigner = true`) when the transaction is executed.
     *
     * ## Notes
     *
     * - This is an internal helper; external callers normally do not need to call it.
     * - Ensures the instruction passes client-side validation before multi-signature execution.
     * - Only affects keys corresponding to the wallet and wallet data account.
     *
     * @param ins - The `TransactionInstruction` to modify
     * @param wallet - Public key of the wallet
     *
     * @returns The same `TransactionInstruction` with wallet-related keys marked as not signed
     *
     * @example
     * ```ts
     * const ins = await walletClient.managerExecutorDeleteInstruction(walletPublicKey, [0]);
     * const modifiedIns = walletClient.changeInstructionNotSign(ins, walletPublicKey);
     *
     * // Now `modifiedIns` can be included in a multisig transaction without requiring
     * // the wallet's on-chain signature immediately.
     * ```
     */
    private changeInstructionNotSign(ins: TransactionInstruction, wallet: PublicKey): TransactionInstruction {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        ins.keys = ins.keys.map(item => {
            const isExcluded =
                item.pubkey.equals(walletDataPubkey) || item.pubkey.equals(wallet);
            return ({
                isSigner: isExcluded ? false : item.isSigner,
                isWritable: item.isWritable,
                pubkey: item.pubkey
            })
        });
        return ins;
    }

    /**
     * Generate a transaction instruction to replace wallet rules (multisig flow).
     *
     * This method creates a `TransactionInstruction` to replace the wallet's
     * current rules with the specified new rules. The instruction is returned
     * **not signed** and must be processed through the multisig flow before
     * submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the replace rules instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce the final transaction.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can replace rules.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the rule change
     * @param rules - Array of new rules to replace
     *
     * @returns A `TransactionInstruction` to replace wallet rules (unsigned)
     *
     * @example
     * ```ts
     * const changeIns = await walletClient.managerRuleChangeInstruction(walletPublicKey, newRules);
     * const tx = new Transaction().add(changeIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerRuleChangeInstruction(wallet: PublicKey, rules: Rule[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleChange({rules: rules as any})
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }


    /**
     * Generate a transaction instruction to add new wallet rules (multisig flow).
     *
     * This method creates a `TransactionInstruction` to append new rules to
     * the wallet. The instruction is returned **not signed** and must be
     * processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the add rules instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can add rules.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the addition
     * @param rules - Array of new rules to add
     *
     * @returns A `TransactionInstruction` to add rules (unsigned)
     *
     * @example
     * ```ts
     * const addIns = await walletClient.managerRuleAddInstruction(walletPublicKey, newRules);
     * const tx = new Transaction().add(addIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerRuleAddInstruction(wallet: PublicKey, rules: Rule[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleAdd({rules: rules as any})
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }

    /**
     * Generate a transaction instruction to delete wallet rules (multisig flow).
     *
     * This method creates a `TransactionInstruction` to remove rules by their
     * indexes from the wallet. The instruction is returned **not signed** and
     * must be processed through the multisig flow before submitting on-chain.
     *
     * ## Multisig Execution Flow
     *
     * 1. Generate the delete rules instruction using this method.
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures.
     * 5. Submit the approved transaction on-chain.
     *
     * ## Notes
     *
     * - Only wallet managers can delete rules.
     * - Instruction is unsigned and **cannot be sent directly**.
     *
     * @param wallet - Wallet public key (manager) performing the deletion
     * @param ruleIndexs - Array of rule indexes to delete
     *
     * @returns A `TransactionInstruction` to delete rules (unsigned)
     *
     * @example
     * ```ts
     * const deleteIns = await walletClient.managerRuleDeleteInstruction(walletPublicKey, [0, 2]);
     * const tx = new Transaction().add(deleteIns);
     *
     * const { tx: multiSigTx, hashIndexes } = await walletClient.convertToMultiSigTx(tx, walletPublicKey, nonce);
     *
     * const pubkeyAndHashs = hashIndexes.map(h => ({
     *   instructionIndex: h.transactionIndex,
     *   nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(h.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(h.hash) },
     *   ],
     * }));
     *
     * const approvedTx = await walletClient.managerExecuteTx(multiSigTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async managerRuleDeleteInstruction(wallet: PublicKey, ruleIndexs: number[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleDelete(ruleIndexs)
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }

    public async delayExecuteVersionTransaction(transaction: Transaction,newExecutor: PublicKey): Promise<VersionedTransaction> {
        const transactionAfter = await this.delayExecuteTransaction(transaction,newExecutor);
        const repo= await this.connect.getLatestBlockhash();
        return toVersionTransaction(transactionAfter,newExecutor,repo.blockhash);
    }


    /**
     * Transform a delayed wallet transaction to be executed by a new executor.
     *
     * When the wallet has "delayed execution" enabled, all transactions are
     * stored as delayed transactions. This method modifies a delayed transaction
     * so that it can be executed by a different executor.
     *
     * Specifically, this method:
     * 1. Scans all instructions in the transaction.
     * 2. Checks if the instruction belongs to the wallet program and matches
     *    the normal execution discriminator.
     * 3. Replaces the first 8 bytes (discriminator) with the delayed execution discriminator.
     * 4. Updates the first key (executor) to `newExecutor`.
     *
     * ## Usage Scenario
     *
     * 1. Backend fetches the delayed transaction from storage.
     * 2. Call this method to set the desired executor for the transaction.
     * 3. The modified transaction can then be sent on-chain by the new executor.
     *
     * ## Notes
     *
     * - Only transactions that match the wallet program and the normal execute discriminator
     *   are modified.
     * - This method does not sign the transaction; signing must be done separately.
     * - It is intended for backend or relayer logic where delayed transactions
     *   are executed on behalf of the original creator.
     *
     * @param transaction - The delayed transaction to modify
     * @param newExecutor - Public key of the executor who will perform the transaction
     *
     * @returns The modified transaction, ready to be signed and sent by the new executor
     *
     * @example
     * ```ts
     * // 1. Fetch the delayed transaction from backend storage
     * const delayedTx = await backend.getDelayedTransaction(txId);
     *
     * // 2. Assign a new executor
     * const txForExecutor = await walletClient.delayExecuteTransaction(delayedTx, newExecutorPublicKey);
     *
     * // 3. Sign and send
     * await sendAndConfirmTransaction(connection, txForExecutor, [newExecutorKeypair]);
     * ```
     */
    public async delayExecuteTransaction(transaction: Transaction, newExecutor: PublicKey): Promise<Transaction> {
        for (let instruction of transaction.instructions) {
            const slice = instruction.data.subarray(0, 8)
            if (instruction.programId.toString() == this.walletProgram.programId.toString() &&
                slice.every((b, i) => b === this.executeDiscriminator.charCodeAt(i))
            ) {
                uint8ArrayAlterFirst(instruction.data, this.delayExecuteDiscriminator);
                instruction.keys[0].pubkey = newExecutor;
            }
        }

        return transaction;
    }

    public async decodeVersionTransactionMultiSig(versionedTransaction: VersionedTransaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]> {

        const proposalTransactionInstructions: DecodeTransactionInstructionType[] = [];
        // If have look table. get look table
        const publicKeys = versionedTransaction.message.staticAccountKeys;
        const compiledInstructions = versionedTransaction.message.compiledInstructions;
        assertTrue(
            compiledInstructions.length !== 0,
            new ValidationError("No multi sig instruction found."),
        );
        for (let addressTableLookup of versionedTransaction.message.addressTableLookups) {
            const res = await this.connect.getAddressLookupTable(addressTableLookup.accountKey);
            if (res.value?.state.addresses) {
                publicKeys.push(...res.value?.state.addresses)
            }
        }
        let nonceInsNum = 0n;
        // check had approval
        for (const [i, mci] of compiledInstructions.entries()) {
            const ixData = mci.data
            const programId = publicKeys[mci.programIdIndex];
            const instructionForSigning = new TransactionInstruction({
                programId: programId,
                data: ixData as unknown as Buffer,
                keys: mci.accountKeyIndexes.map((i: number) => ({
                    pubkey: publicKeys[i],
                    isSigner: versionedTransaction.message.isAccountSigner(i),
                    isWritable: versionedTransaction.message.isAccountWritable(i),
                })),
            });
            if (
                ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))
            ) {
                const hashBuffer = await getTransactionHashWithNonce(
                    instructionForSigning,
                    0,
                    nonce + nonceInsNum,
                );
                proposalTransactionInstructions.push({
                    hash: hashBuffer,
                    instructionIndex: i,
                    nonce: nonceInsNum
                });
                nonceInsNum += 1n;
            }
        }

        return proposalTransactionInstructions;
    }


    /**
     * Decode a native wallet transaction into multi-signature instructions.
     *
     * This method scans a `Transaction` and generates the necessary
     * hash information for each instruction that involves the wallet's
     * own key. The returned data can then be signed by the managers
     * as part of the multisig approval flow.
     *
     * Specifically, for each instruction that:
     * - Has length >= 8 bytes
     * - Includes the wallet public key in its keys
     *
     * The method:
     * 1. Computes the transaction hash using `getTransactionHashWithNonce`.
     * 2. Stores the hash, instruction index, and nonce in the result array.
     * 3. Increments the nonce for the next instruction.
     *
     * ## Usage Scenario
     *
     * 1. You have a prepared Transaction (native, unsigned).
     * 2. Call this method to decode it into multi-signature instructions.
     * 3. Each returned `DecodeTransactionInstructionType` contains:
     *    - `hash`: The message that managers need to sign off-chain.
     *    - `instructionIndex`: Index of the instruction in the Transaction.
     *    - `nonce`: Nonce used for the hash, required for signing.
     *
     * 4. Managers sign the hashes and inject signatures back into the Transaction
     *    using `managerExecuteTx`.
     *
     * ## Notes
     *
     * - Only instructions that include the wallet key are processed.
     * - Non-wallet instructions are ignored.
     * - This method does not modify the original Transaction.
     *
     * @param transaction - The native Transaction to decode
     * @param wallet - Wallet public key to identify which instructions require multi-sig
     * @param nonce - Starting nonce for generating transaction hashes
     *
     * @returns An array of decoded instructions for multi-signature signing
     *
     * @example
     * ```ts
     * // 1. Decode the native transaction into multisig instructions
     * const decodedInstructions = await walletClient.decodeTransactionMultiSig(nativeTx, walletPublicKey, startingNonce);
     *
     * // 2. Managers sign each hash off-chain
     * const pubkeyAndHashs = decodedInstructions.map(item => ({
     *   instructionIndex: item.instructionIndex,
     *   nonce: item.nonce,
     *   signatures: [
     *     { signer: manager1.publicKey, signature: manager1.signMessage(item.hash) },
     *     { signer: manager2.publicKey, signature: manager2.signMessage(item.hash) },
     *   ],
     * }));
     *
     * // 3. Inject signatures into the transaction
     * const approvedTx = await walletClient.managerExecuteTx(nativeTx, walletPublicKey, submittingManager.publicKey, pubkeyAndHashs);
     *
     * // 4. Send transaction on-chain
     * await sendAndConfirmTransaction(connection, approvedTx, [submittingManager]);
     * ```
     */
    public async decodeTransactionMultiSig(transaction: Transaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]> {

        const proposalTransactionInstructions: DecodeTransactionInstructionType[] = [];
        let nonceInsNum = nonce;

        for (const [i, instructionForSigning] of transaction.instructions.entries()) {
            const ixData = instructionForSigning.data;
            if (
                ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))
            ) {
                let offset = 0;
                if(instructionForSigning.programId.toString()==this.walletProgram.programId.toString()){
                    offset = 1;
                }
                const hashBuffer =await  getTransactionHashWithNonce(
                    instructionForSigning,
                    offset,
                    nonceInsNum,
                );
                proposalTransactionInstructions.push({
                    hash: hashBuffer,
                    instructionIndex: i,
                    nonce: nonceInsNum
                });
                nonceInsNum += 1n;
            }
        }

        return proposalTransactionInstructions;
    }


    /**
     * Build a meta-transaction instruction.
     *
     * This method executes a **pre-signed instruction** using a meta-transaction model:
     * the signer authorizes execution off-chain, while the executor submits the
     * transaction on-chain and pays the gas fee.
     *
     * ## Usage Flow
     *
     * 1. Call {@link getMetaTransactionHash} to generate the signing hash
     * 2. The `singer` signs the returned hash off-chain
     * 3. Call this method with the signature to build the on-chain instruction
     *
     * The program will verify:
     * - signature validity
     * - signer identity
     * - expiration timestamp
     *
     * @param ins - Original instruction to be executed
     * @param wallet - Wallet public key that owns the custody account
     * @param singer - Signer who authorized the meta-transaction off-chain
     * @param expireAt - Expiration timestamp (unix seconds)
     * @param signature - Signature produced by signing the meta-transaction hash
     * @param executor - Account that submits the transaction and pays gas
     *
     * @returns A `TransactionInstruction` ready to be sent on-chain
     * @example
     * ```ts
     * // 1. Prepare original instruction
     * const ins = program.methods
     *   .doSomething(...)
     *   .accounts(...)
     *   .instruction();
     *
     * // 2. Generate meta-transaction hash
     * const expireAt = BigInt(Math.floor(Date.now()  / 1000) + 60);
     * const skip = 0;
     *
     * const hash = await getMetaTransactionHash(
     *   ins,
     *   skip,
     *   executor.publicKey,
     *   expireAt,
     * );
     *
     * // 3. Sign hash off-chain
     * const signature = signerKeypair.signMessage(hash);
     *
     * // 4. Build meta instruction
     * const metaIx = await walletClient.metaInstruction(
     *   ins,
     *   walletPublicKey,
     *   signerKeypair.publicKey,
     *   expireAt,
     *   signature,
     *   executor.publicKey,
     * );
     *
     * // 5. Executor sends transaction
     * const tx = new Transaction().add(metaIx);
     * await sendAndConfirmTransaction(connection, tx, [executor]);
     * ```
     */
    public async metaInstruction (
        ins: TransactionInstruction,
        wallet: PublicKey,
        singer: PublicKey,
        expireAt: bigint,
        signature: Uint8Array,
        executor: PublicKey,
    ):Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const instruction = await this.walletProgram.methods.metaExecute({
            hashSign: Array.from(signature),
            signTimestamp: new BN(expireAt),
            data: ins.data
        })
            .accounts({
                executor: executor,
                singer: singer,
                custodyAccount: walletDataPubkey,
                proxyProgram: ins.programId
            }).
            remainingAccounts(ins.keys).instruction();

        return instruction;
    }

}

type DecodeTransactionInstructionType = {
    instructionIndex: number,
    hash: Uint8Array,
    nonce: bigint
}

export type TransactionInstructionSignatureType = {
    instructionIndex: number,
    nonce: bigint
    hash: Uint8Array,
    signatures: {
        singer: PublicKey,
        signature: Uint8Array
    }[]
}

export type ChainWalletClientInitType = {
    endpoint?: string
    network?: NET_WORK
    confirmOptions?: ConfirmOptions
}

const dummyWallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signAllTransactions: async (txs: any) => txs,
    signTransaction: async (tx: any) => tx,
};


export type PubkeyWithSignHash = {
    hashSign: Uint8Array,
    wallet: PublicKey,
}

export type InstructionWithHash = {
    instruction: TransactionInstruction,
    hash: Uint8Array,
}

export type InstructionIndexWithHash = {
    transactionIndex: number,
    hash: Uint8Array,
}

export default ChainWalletClient;