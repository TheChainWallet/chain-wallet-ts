import {AnchorProvider, BN, Program} from "@coral-xyz/anchor";
import {ChainWallet} from "../idl/chain_wallet";
import {ACCOUNR_SEED, AccountStatus, DEFAULT_NET_WORK, getDefaultEndpoint, NET_WORK} from "../constansts";
import {
    ConfirmOptions,
    Connection,
    MessageCompiledInstruction,
    MessageV0,
    PublicKey, SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction
} from "@solana/web3.js";
import devWalletIdl from '../idl/devnet/chain_wallet.json';
// import testWalletIdl from '../../packages/idl/test/idl/chain_wallet.json';
import mainWalletIdl from '../idl/mainnet/chain_wallet.json';
import {Rule} from "./rule-type";
import {getTransactionHashWithNonce, replaceWith, uint8ArrayAlterFirst} from "../utils";
import {assertTrue, NotSupportError, ValidationError} from "../error";

export class ChainWalletClient {

    public walletProgram: Program<ChainWallet>;



    private provider: AnchorProvider;

    public connect: Connection;

    private delayExecuteDiscriminator;

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

    }

    public async executorTxConvert(tx: Transaction, wallet: PublicKey, executor: PublicKey): Promise<Transaction> {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let ins of instructions) {
            if (ins.keys.filter(d => d.pubkey.equals(wallet) && d.isSigner == true)) {
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
        const [walletDataPubkey, _] = PublicKey.findProgramAddressSync([Buffer.from(ACCOUNR_SEED), wallet.toBuffer()], this.walletProgram.programId);
        return walletDataPubkey;
    }

    public async createWallet(
        name: string,
        user: PublicKey,
        threshold: number,
        executors: PublicKey[],
        userAdmins: PublicKey[]
    ): Promise<Transaction> {
        const nonce = new Date().getTime();
        const nonceSeed = Buffer.alloc(8);
        nonceSeed.writeBigUInt64LE(BigInt(nonce));
        const [wallet, _] = PublicKey.findProgramAddressSync([Buffer.from("wallet"), nonceSeed], this.walletProgram.programId);
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
                lamports: await this.connect.getMinimumBalanceForRentExemption(0,"processed")
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
        for (let [index,ins] of instructions.entries()) {
            if (pubkeyAndHashs.find(item=>item.instructionIndex==index)){
                const transactionInstructionSignature = pubkeyAndHashs.find(item=>item.instructionIndex==index);
                const approvalParams = {
                    data: ins.data,
                    hashs: transactionInstructionSignature!.signatures.map(item=>Array.from(item.signature)),
                    nonce: new BN(transactionInstructionSignature!.nonce),
                };
                transactionInstructionSignature!.signatures.forEach(d => {
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
        const hash = getTransactionHashWithNonce(ins, 0, BigInt(nonce));
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
        return ins;
    }

    public async managerChangeStatusInstruction(wallet: PublicKey, status: AccountStatus): Promise<TransactionInstruction> {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .statusChange(status as any)
            .accounts({
                manager: wallet,
                custodyAccount: walletDataPubkey
            }).instruction();
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
        return ins;
    }

    public async delayExecuteTransaction(rawTx: string): Promise<VersionedTransaction> {
        const txUse = VersionedTransaction.deserialize(Buffer.from(rawTx, 'base64'));
        const instructions: MessageCompiledInstruction[] = [];
        let executor: PublicKey;
        for (let compiledInstruction of txUse.message.compiledInstructions) {
            if (txUse.message.staticAccountKeys[compiledInstruction.programIdIndex].toString() == this.walletProgram.programId.toString()) {
                // delete index 5
                compiledInstruction.accountKeyIndexes.splice(5, 1);
                // delete index 3
                compiledInstruction.accountKeyIndexes.splice(3, 1);
                executor = txUse.message.staticAccountKeys[compiledInstruction.accountKeyIndexes[0]];
                uint8ArrayAlterFirst(compiledInstruction.data, this.delayExecuteDiscriminator);
                instructions.push(compiledInstruction);
            }
        }
        replaceWith(txUse.message.staticAccountKeys, this.walletProgram.programId, this.walletProgram.programId, (a, b) => a.equals(b));

        const newMessage = new MessageV0({
            header: txUse.message.header,
            recentBlockhash: txUse.message.recentBlockhash,
            staticAccountKeys: txUse.message.staticAccountKeys,
            compiledInstructions: instructions,
            addressTableLookups: txUse.message.addressTableLookups,
        });

        return new VersionedTransaction(newMessage);
    }

    public async decodeTransactionMultiSig(versionedTransaction: VersionedTransaction, wallet: PublicKey, nonce: bigint): Promise<DecodeTransactionInstructionType[]> {

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
            const ixData = Buffer.from(mci.data);
            const programId = publicKeys[mci.programIdIndex];
            const instructionForSigning = new TransactionInstruction({
                programId: programId,
                data: Buffer.from(mci.data),
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
                const hashBuffer = getTransactionHashWithNonce(
                    instructionForSigning,
                    0,
                    nonce + nonceInsNum,
                );
                proposalTransactionInstructions.push({
                    hash: hashBuffer,
                    instructionIndex: i,
                });
                nonceInsNum += 1n;
            }
        }

        return proposalTransactionInstructions;
    }

}

type DecodeTransactionInstructionType = {
    instructionIndex: number,
    hash: Buffer
}

type TransactionInstructionSignatureType = {
    instructionIndex: number,
    nonce: bigint
    hash: Buffer,
    signatures: {
        singer: PublicKey,
        signature: Buffer
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