import { Program } from "@coral-xyz/anchor";
import { ChainWallet } from "./idl/chain_wallet";
import { AccountStatus, NET_WORK } from "./constansts";
import { ConfirmOptions, Connection, PublicKey, Transaction, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { Rule } from "./rule-type";
export declare class ChainWalletClient {
    walletProgram: Program<ChainWallet>;
    private provider;
    connect: Connection;
    private delayExecuteDiscriminator;
    private executeDiscriminator;
    constructor(opt?: ChainWalletClientInitType);
    executorTxConvert(tx: Transaction, wallet: PublicKey, executor: PublicKey): Promise<Transaction>;
    findWalletDataPubkeyByWallet(wallet: PublicKey): PublicKey;
    createWallet(name: string, user: PublicKey, threshold: number, executors: PublicKey[], userAdmins: PublicKey[]): Promise<Transaction>;
    managerExecuteTx(tx: Transaction, wallet: PublicKey, manager: PublicKey, pubkeyAndHashs: TransactionInstructionSignatureType[]): Promise<Transaction>;
    convertToMultiSigInstruction(instruction: TransactionInstruction, wallet: PublicKey, nonce: number): Promise<InstructionWithHash>;
    convertToMultiSigTx(tx: Transaction, wallet: PublicKey, nonce: number): Promise<{
        tx: Transaction;
        hashIndexes: InstructionIndexWithHash[];
    }>;
    managerExecutorDeleteInstruction(wallet: PublicKey, executorIndexs: number[]): Promise<TransactionInstruction>;
    managerExecutorAddInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
    managerExecutorReplaceInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
    managerMangersDeleteInstruction(wallet: PublicKey, managerIndexs: number[]): Promise<TransactionInstruction>;
    managerMangersAddInstruction(wallet: PublicKey, managerPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
    managerMangersReplaceInstruction(wallet: PublicKey, managerPublicKeys: PublicKey[]): Promise<TransactionInstruction>;
    managerChangeThresholdInstruction(wallet: PublicKey, threshold: number): Promise<TransactionInstruction>;
    managerChangeStatusInstruction(wallet: PublicKey, status: AccountStatus): Promise<TransactionInstruction>;
    private changeInstructionNotSign;
    managerRuleChangeInstruction(wallet: PublicKey, rules: Rule[]): Promise<TransactionInstruction>;
    managerRuleAddInstruction(wallet: PublicKey, rules: Rule[]): Promise<TransactionInstruction>;
    managerRuleDeleteInstruction(wallet: PublicKey, ruleIndexs: number[]): Promise<TransactionInstruction>;
    delayExecuteVersionTransaction(transaction: Transaction, newExecutor: PublicKey): Promise<VersionedTransaction>;
    delayExecuteTransaction(transaction: Transaction, newExecutor: PublicKey): Promise<Transaction>;
    decodeVersionTransactionMultiSig(versionedTransaction: VersionedTransaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]>;
    decodeTransactionMultiSig(transaction: Transaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]>;
}
type DecodeTransactionInstructionType = {
    instructionIndex: number;
    hash: Uint8Array;
    nonce: bigint;
};
export type TransactionInstructionSignatureType = {
    instructionIndex: number;
    nonce: bigint;
    hash: Uint8Array;
    signatures: {
        singer: PublicKey;
        signature: Uint8Array;
    }[];
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
export default ChainWalletClient;
//# sourceMappingURL=chain-wallet.d.ts.map