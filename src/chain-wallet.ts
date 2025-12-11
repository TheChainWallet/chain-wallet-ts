import {AnchorProvider, Program} from "@coral-xyz/anchor";
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
import {getTransactionHashWithNonce, toVersionTransaction, uint8ArrayAlterFirst} from "./utils";
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

    public async createWallet(
        name: string,
        user: PublicKey,
        threshold: number,
        executors: PublicKey[],
        userAdmins: PublicKey[]
    ): Promise<Transaction> {
        const nonce = new Date().getTime();
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

    public async managerExecutorDeleteInstruction(wallet: PublicKey, executorIndexs: number[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorDelete(executorIndexs)
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }

    public async managerExecutorAddInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorAdd({
                executorNum: executorPublicKeys.length
            })
            .accounts({
                manager: wallet,
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

    public async managerExecutorReplaceInstruction(wallet: PublicKey, executorPublicKeys: PublicKey[]): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorChange({
                executorNum: executorPublicKeys.length
            })
            .accounts({
                manager: wallet,
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

    public async decodeTransactionMultiSig(transaction: Transaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]> {

        const proposalTransactionInstructions: DecodeTransactionInstructionType[] = [];
        let nonceInsNum = nonce;

        for (const [i, instructionForSigning] of transaction.instructions.entries()) {
            const ixData = instructionForSigning.data;
            if (
                ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))
            ) {
                const hashBuffer =await  getTransactionHashWithNonce(
                    instructionForSigning,
                    0,
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