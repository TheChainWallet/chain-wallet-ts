import { BorshCoder, Program } from "@coral-xyz/anchor";
import { ChainWallet } from "./idl/chain_wallet";
import { AccountStatus, NET_WORK } from "./constansts";
import { ConfirmOptions, Connection, PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { FilterType, TriggerType, TransactionParamsRule, TransactionInvokeTimesRule, TransferFreqRule, TransferFreqTimesRule, Rule } from "./rule-type";
export declare class ChainWalletClient {
    walletProgram: Program<ChainWallet>;
    coder: BorshCoder<string, string>;
    private delayExecuteDiscriminator;
    private multisigPushDiscriminator;
    private executeDiscriminator;
    private provider;
    connect: Connection;
    constructor(opt?: ChainWalletClientInitType);
    executorTxConvert(tx: Transaction, wallet: PublicKey, executor: PublicKey): Promise<Transaction>;
    findWalletDataPubkeyByWallet(wallet: PublicKey): PublicKey;
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
    createWallet(name: string, user: PublicKey, threshold: number, executors: PublicKey[], userAdmins: PublicKey[], nonce?: number): Promise<Transaction>;
    getInstructionDataWithNonceWallet(nonce: number, wallet: PublicKey): PublicKey;
    /**
     * Push a transaction instruction into the multisig flow.
     *
     * This method pushes the provided transaction instruction into the multisig flow.
     * It creates a multisig instruction that can later be approved or rejected by the wallet managers.
     *
     * ## Example
     * ```ts
     * const multisigPushIns = await walletClient.multisigPushInstruction(
     *   deleteInstruction,
     *   walletPublicKey,
     *   managerPublicKey
     * );
     * ```
     *
     * @param ins - The `TransactionInstruction` to push into the multisig flow
     * @param wallet - Public key of the wallet (manager) performing the operation
     * @param manager - Public key of the manager executing the operation
     *
     * @param nonce
     * @param remark -
     * @returns A `TransactionInstruction` that pushes the transaction into the multisig flow
     */
    multisigPushInstruction(ins: TransactionInstruction, wallet: PublicKey, manager: PublicKey, remark: string, nonce?: number): Promise<TransactionInstruction>;
    /**
     * Approve or reject a transaction instruction in the multisig flow.
     *
     * This method allows the manager to approve or reject a multisig transaction.
     * It requires the `instructionNonce` to ensure the uniqueness of the transaction.
     *
     * ## Example
     * ```ts
     * await walletClient.multisigApprovalRejectInstruction(
     *   instructionNonce,
     *   walletPublicKey,
     *   managerPublicKey,
     *   'approve'
     * );
     * ```
     *
     * @param instructionNonce - A unique nonce to maintain the transaction's uniqueness
     * @param wallet - Public key of the wallet (manager) performing the approval or rejection
     * @param manager - Public key of the manager approving or rejecting the transaction
     * @param approvalOrReject - The approval or rejection status ('approve' or 'reject')
     *
     * @returns A `TransactionInstruction` that approves or rejects the transaction
     */
    multisigApprovalRejectInstruction(instructionNonce: bigint, wallet: PublicKey, manager: PublicKey, approvalOrReject: ApprovalOrReject): Promise<TransactionInstruction>;
    /**
     * Execute a multisig transaction instruction.
     *
     * This method executes a previously approved multisig transaction instruction.
     * It requires the `instructionNonce` and the transaction data to finalize and submit the transaction on-chain.
     *
     * ## Example
     * ```ts
     * await walletClient.multisigExecuteInstruction(
     *   deleteInstruction,
     *   instructionNonce,
     *   walletPublicKey,
     *   managerPublicKey
     * );
     * ```
     *
     * @param ins - The `TransactionInstruction` to execute in the multisig flow
     * @param instructionNonce - A unique nonce to maintain the transaction's uniqueness
     * @param wallet - Public key of the wallet (manager) performing the operation
     * @param manager - Public key of the manager executing the operation
     *
     * @returns A `TransactionInstruction` that executes the transaction on-chain
     */
    multisigExecuteInstruction(ins: TransactionInstruction, instructionNonce: bigint, wallet: PublicKey, manager: PublicKey): Promise<TransactionInstruction>;
    /**
     * Delete executors from the wallet using multisig flow.
     *
     * This method follows the multisig flow to delete one or more executors from the wallet.
     * The process includes:
     * 1. Generating the delete executor instruction using `managerExecutorDeleteInstruction`.
     * 2. Pushing the instruction into the multisig flow using `multisigPushInstruction`.
     * 3. Managers approve or reject the transaction using `multisigApprovalRejectInstruction`.
     * 4. Executing the transaction using `multisigExecuteInstruction`.
     * * ## Example
     * The process to delete executors with multisig approval:
     *      * ```ts
     * // 1. Define the necessary parameters
     * const walletPublicKey = new PublicKey('...');
     * const executorIndexes = [0, 2];  // The indexes of the executors to delete
     * const instructionNonce = BigInt(12345);  // Unique nonce for the instruction
     * const managerPublicKey = new PublicKey('...');  // Public key of the wallet manager
     * const approvalOrReject: ApprovalOrReject = 'approve';  // Set approval or rejection status
     * // 2. Generate the delete executor instruction
     * const deleteIns = await walletClient.managerExecutorDeleteInstruction(walletPublicKey, executorIndexes);
     * // 3. Push the delete instruction into the multisig flow
     * const pushIns = await walletClient.multisigPushInstruction(deleteIns, walletPublicKey, managerPublicKey);
     * // 4. Managers approve or reject the transaction
     * await walletClient.multisigApprovalRejectInstruction(instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     * // 5. If approved, execute the transaction
     * if (approvalOrReject === 'approve') {
     *   await walletClient.multisigExecuteInstruction(deleteIns, instructionNonce, walletPublicKey, managerPublicKey);
     * } else {
     *   console.log('Transaction rejected by manager');
     * }
     * ```
     *
     * @param wallet - Public key of the wallet (manager) performing the deletion
     * @param executorIndexs - Array of indexes of executors to remove
     * @param instructionNonce - Nonce for the instruction to maintain uniqueness in multisig flow
     * @param manager - Public key of the wallet manager
     * @param approvalOrReject - Approval or rejection status for the transaction
     *
     * @returns A promise that resolves when the deletion process is complete
     */
    managerExecutorDeleteInstruction(wallet: PublicKey, executorIndexs: number[]): Promise<TransactionInstruction>;
    /**
     * Add executors to the wallet using multisig flow.
     *
     * This method follows the multisig flow to add one or more executors to the wallet.
     * The process includes:
     * 1. Generating the add executor instruction using `managerExecutorAddInstruction`.
     * 2. Pushing the instruction into the multisig flow using `multisigPushInstruction`.
     * 3. Managers approve or reject the transaction using `multisigApprovalRejectInstruction`.
     * 4. Executing the transaction using `multisigExecuteInstruction`.
     *
     * ## Example
     * The process to add executors with multisig approval:
     *
     * ```ts
     * // 1. Define the necessary parameters
     * const walletPublicKey = new PublicKey('...');
     * const executorPublicKeys = [
     *   new PublicKey('...'),  // Public key of the first executor
     *   new PublicKey('...')   // Public key of the second executor
     * ];
     * const instructionNonce = BigInt(12345);  // Unique nonce for the instruction
     * const managerPublicKey = new PublicKey('...');  // Public key of the wallet manager
     * const approvalOrReject: ApprovalOrReject = 'approve';  // Set approval or rejection status
     *
     * // 2. Generate the add executor instruction
     * const addIns = await walletClient.managerExecutorAddInstruction(walletPublicKey, executorPublicKeys);
     *
     * // 3. Push the add instruction into the multisig flow
     * const pushIns = await walletClient.multisigPushInstruction(addIns, walletPublicKey, managerPublicKey);
     *
     * // 4. Managers approve or reject the transaction
     * await walletClient.multisigApprovalRejectInstruction(instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     *
     * // 5. If approved, execute the transaction
     * if (approvalOrReject === 'approve') {
     *   await walletClient.multisigExecuteInstruction(addIns, instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     * } else {
     *   console.log('Transaction rejected by manager');
     * }
     * ```
     *
     * ## Notes
     * - The `walletPublicKey` is the public key of the wallet (manager) performing the addition.
     * - `executorPublicKeys` is an array of public keys of the executors to add.
     * - `instructionNonce` is a unique identifier to maintain the transaction's uniqueness and avoid replay attacks.
     * - `managerPublicKey` is the public key of the wallet manager who will approve or reject the transaction.
     * - `approvalOrReject` indicates whether the transaction should be approved or rejected.
     *
     * @param wallet - Public key of the wallet (manager) performing the addition
     * @param executorPublicKeys - Array of public keys of executors to add
     *
     * @returns A promise that resolves with a `TransactionInstruction` to add the specified executors (unsigned)
     */
    managerExecutorAddInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
    /**
     * Replace executors in the wallet using multisig flow.
     *
     * This method follows the multisig flow to replace one or more executors in the wallet.
     * The process includes:
     * 1. Generating the replace executor instruction using `managerExecutorReplaceInstruction`.
     * 2. Pushing the instruction into the multisig flow using `multisigPushInstruction`.
     * 3. Managers approve or reject the transaction using `multisigApprovalRejectInstruction`.
     * 4. Executing the transaction using `multisigExecuteInstruction`.
     *
     * ## Example
     * The process to replace executors with multisig approval:
     *
     * ```ts
     * // 1. Define the necessary parameters
     * const walletPublicKey = new PublicKey('...');
     * const executorPublicKeys = [
     *   new PublicKey('...'),  // Public key of the first new executor
     *   new PublicKey('...')   // Public key of the second new executor
     * ];
     * const instructionNonce = BigInt(12345);  // Unique nonce for the instruction
     * const managerPublicKey = new PublicKey('...');  // Public key of the wallet manager
     * const approvalOrReject: ApprovalOrReject = 'approve';  // Set approval or rejection status
     *
     * // 2. Generate the replace executor instruction
     * const replaceIns = await walletClient.managerExecutorReplaceInstruction(walletPublicKey, executorPublicKeys);
     *
     * // 3. Push the replace instruction into the multisig flow
     * const pushIns = await walletClient.multisigPushInstruction(replaceIns, walletPublicKey, managerPublicKey);
     *
     * // 4. Managers approve or reject the transaction
     * await walletClient.multisigApprovalRejectInstruction(instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     *
     * // 5. If approved, execute the transaction
     * if (approvalOrReject === 'approve') {
     *   await walletClient.multisigExecuteInstruction(replaceIns, instructionNonce, walletPublicKey, managerPublicKey, approvalOrReject);
     * } else {
     *   console.log('Transaction rejected by manager');
     * }
     * ```
     *
     * ## Notes
     * - The `walletPublicKey` is the public key of the wallet (manager) performing the replacement.
     * - `executorPublicKeys` is an array of public keys of the new executors to replace the old ones.
     * - `instructionNonce` is a unique identifier to maintain the transaction's uniqueness and avoid replay attacks.
     * - `managerPublicKey` is the public key of the wallet manager who will approve or reject the transaction.
     * - `approvalOrReject` indicates whether the transaction should be approved or rejected.
     *
     * @param wallet - Public key of the wallet (manager) performing the replacement
     * @param executorPublicKeys - Array of public keys of new executors to add
     *
     * @returns A promise that resolves with a `TransactionInstruction` to replace the specified executors (unsigned)
     */
    managerExecutorReplaceInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
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
    managerMangersDeleteInstruction(wallet: PublicKey, managerIndexs: number[]): Promise<TransactionInstruction>;
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
    managerMangersAddInstruction(wallet: PublicKey, managerPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
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
    managerMangersReplaceInstruction(wallet: PublicKey, managerPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
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
    managerChangeThresholdInstruction(wallet: PublicKey, threshold: number): Promise<TransactionInstruction>;
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
    managerChangeStatusInstruction(wallet: PublicKey, status: AccountStatus): Promise<TransactionInstruction>;
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
    private changeInstructionNotSign;
    /**
     * Create an effect rule.
     *
     * This method creates a rule of type `effect`, which is typically used as a
     * generic policy/effect marker under a given filter and trigger type.
     *
     * ## Notes
     * - This helper only builds the `Rule` object; it does not send any instruction on-chain.
     * - The returned rule can be used in `managerRuleAddInstruction` / `managerRuleChangeInstruction`.
     *
     * @param filter - Rule filter definition (scope/conditions)
     * @param trigger - Trigger type for when the rule should be applied
     *
     * @returns A `Rule` object with `ruleType.effect`
     *
     * @example
     * ```ts
     * const rule = client.createEffectRole(defaultFilter, defaultTrigger);
     * const ix = await client.managerRuleAddInstruction(wallet, [rule]);
     * ```
     **/
    createEffectRole(filter: FilterType, trigger: TriggerType): Rule;
    /**
     *
     *   Create a transfer amount rule.
     *
     *   This method creates a rule that constrains or checks a transfer amount
     *   (depending on on-chain rule semantics) under the given filter and trigger type.
     *
     *  Notes
     *    This helper only builds the Rule object; it does not send any instruction on-chain.
     *    amount is expressed as bigint (base unit as expected by the program).
     *
     *   @param filter - Rule filter definition (scope/conditions)
     *   @param trigger - Trigger type for when the rule should be applied
     *   @param amount - Amount threshold/parameter for the rule
     *
     *    @returns A Rule object with ruleType.transferAmount
     *
     *    @example
     *
     *    const rule = client.createTransferAmountRule(defaultFilter, defaultTrigger, 1_000_000n);
     *    const ix = await client.managerRuleAddInstruction(wallet, [rule]);
     **/
    createTransferAmountRule(filter: FilterType, trigger: TriggerType, amount: bigint): Rule;
    /**
     * Create a transfer frequency rule.
     *
     * This method creates a rule that constrains or checks transfer frequency
     * using the provided parameters, under the given filter and trigger type.
     *
     * Notes
     * This helper only builds the Rule object; it does not send any instruction on-chain.
     * The exact meaning of params is defined by the on-chain program.
     *
     * @param filter - Rule filter definition (scope/conditions)
     * @param trigger - Trigger type for when the rule should be applied
     * @param params - Frequency rule parameters
     *
     * @returns A Rule object with ruleType.transferFreq
     *
     * @example
     *
     * const rule = client.createTransferFreqRule(defaultFilter, defaultTrigger, {
     * // ...TransferFreqRule fields
     * } as any);
     * const ix = await client.managerRuleAddInstruction(wallet, [rule]);
     **/
    createTransferFreqRule(filter: FilterType, trigger: TriggerType, params: TransferFreqRule): Rule;
    /**
     * Create a transfer frequency (*times) rule.
     *
     * This method creates a rule that constrains or checks transfer count/times
     * using the provided parameters, under the given filter and trigger type.
     *
     * Notes
     * This helper only builds the Rule object; it does not send any instruction on-chain.
     * The exact meaning of params is defined by the on-chain program.
     *
     * @param filter - Rule filter definition (scope/conditions)
     * @param trigger - Trigger type for when the rule should be applied
     * @param params - Frequency-times rule parameters
     *
     * @returns A Rule object with ruleType.transferTimes
     *
     * @example
     *
     * const rule = client.createTransferFreqTimesRule(defaultFilter, defaultTrigger, {
     * // ...TransferFreqTimesRule fields
     * } as any);
     * const ix = await client.managerRuleAddInstruction(wallet, [rule]);
     */
    createTransferFreqTimesRule(filter: FilterType, trigger: TriggerType, params: TransferFreqTimesRule): Rule;
    /**
     * Create a transaction params rule.
     *
     * This method creates a rule that constrains or checks transaction parameters
     * using the provided parameters, under the given filter and trigger type.
     *
     * Notes
     * This helper only builds the Rule object; it does not send any instruction on-chain.
     * The exact meaning of params is defined by the on-chain program.
     *
     * @param filter - Rule filter definition (scope/conditions)
     * @param trigger - Trigger type for when the rule should be applied
     * @param params - Transaction params rule parameters
     *
     * @returns A Rule object with ruleType.transactionParams
     *
     * @example
     *
     * const rule = client.createTransactionParamsRule(defaultFilter, defaultTrigger, {
     * // ...TransactionParamsRule fields
     * } as any);
     * const ix = await client.managerRuleAddInstruction(wallet, [rule]);
     */
    createTransactionParamsRule(filter: FilterType, trigger: TriggerType, params: TransactionParamsRule): Rule;
    /**
     * Create a transaction invoke times rule.
     *
     * This method creates a rule that constrains or checks how many times a transaction
     * can be invoked using the provided parameters, under the given filter and trigger type.
     *
     * Notes
     * This helper only builds the Rule object; it does not send any instruction on-chain.
     * The exact meaning of params is defined by the on-chain program.
     *
     * @param filter - Rule filter definition (scope/conditions)
     * @param trigger - Trigger type for when the rule should be applied
     * @param params - Transaction invoke-times rule parameters
     *
     * @returns A Rule object with ruleType.transactionTimes
     *
     * @example
     *
     * const rule = client.createTransactionInvokeTimesRule(defaultFilter, defaultTrigger, {
     * // ...TransactionInvokeTimesRule fields
     * } as any);
     * const ix = await client.managerRuleAddInstruction(wallet, [rule]);
     */
    createTransactionInvokeTimesRule(filter: FilterType, trigger: TriggerType, params: TransactionInvokeTimesRule): Rule;
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
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for the existing managers.
     * 3. Managers sign the hashes off-chain.
     * 4. Call `managerExecuteTx` to inject the signatures and produce a final transaction.
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
    managerRuleChangeInstruction(wallet: PublicKey, rules: Rule[]): Promise<TransactionInstruction>;
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
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for existing managers.
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
    managerRuleAddInstruction(wallet: PublicKey, rules: Rule[]): Promise<TransactionInstruction>;
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
     * 2. Convert the instruction to a multisig transaction using `convertToMultiSigTx`,
     *    which produces signing hashes for existing managers.
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
    managerRuleDeleteInstruction(wallet: PublicKey, ruleIndexs: number[]): Promise<TransactionInstruction>;
    delayExecuteVersionTransaction(transaction: Transaction, newExecutor: PublicKey): Promise<VersionedTransaction>;
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
    delayExecuteTransaction(transaction: Transaction, newExecutor: PublicKey): Promise<Transaction>;
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
    metaInstruction(ins: TransactionInstruction, wallet: PublicKey, singer: PublicKey, expireAt: bigint, signature: Uint8Array, executor: PublicKey): Promise<TransactionInstruction>;
    decodeTransactionMultiSig(transaction: Transaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]>;
    /**
     * Convert a multisigPush instruction to a multisigExecute instruction.
     *
     * This method extracts data from a multisigPush instruction and creates
     * a corresponding multisigExecute instruction.
     *
     * MultisigPush accounts structure:
     * - [0] user
     * - [1] custody_account
     * - [2] wallet
     * - [3] instruction_data
     * - [4] proxy_program
     * - [5] system_program
     * - [6+] remaining_accounts (original instruction keys)
     *
     * @param pushInstruction - The multisigPush instruction to convert
     * @param manager - Public key of the manager executing the transaction
     * @param nonce - The nonce for the multisigExecute
     *
     * @returns A `TransactionInstruction` for multisigExecute
     *
     * @example
     * ```ts
     * const pushIns = await walletClient.multisigPushInstruction(originalIns, walletPublicKey, managerPublicKey, "remark");
     * // Later, to execute:
     * const executeIns = await walletClient.multisigPushToMultisigExecute(pushIns, managerPublicKey, nonce);
     * ```
     */
    multisigPushToMultisigExecute(pushInstruction: TransactionInstruction, manager: PublicKey, nonce: bigint): Promise<TransactionInstruction | null>;
}
type DecodeTransactionInstructionType = {
    instructionIndex: number;
    nonce: bigint;
    proposalType: "MULITSIG" | "RISK_MULITSIG";
};
export type ChainWalletClientInitType = {
    endpoint?: string;
    network?: NET_WORK;
    confirmOptions?: ConfirmOptions;
};
export type PubkeyWithSignHash = {
    hashSign: Uint8Array;
    wallet: PublicKey;
};
export type InstructionWithHash = {
    instruction: TransactionInstruction;
    hash: Uint8Array;
};
export type InstructionIndexWithHash = {
    transactionIndex: number;
    hash: Uint8Array;
};
export type ApprovalOrReject = "approve" | "reject";
export default ChainWalletClient;
//# sourceMappingURL=chain-wallet.d.ts.map