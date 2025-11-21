import {AnchorProvider, BN, Program} from "@coral-xyz/anchor";
import {ChainWallet} from "@the-chain-wallet/idl/types/chain_wallet";
import {Proxy} from "@the-chain-wallet/idl/types/proxy";
import {ACCOUNR_SEED, AccountStatus, DEFAULT_NET_WORK, getDefaultEndpoint, NET_WORK} from "../constansts";
import {
    ConfirmOptions,
    Connection,
    MessageCompiledInstruction,
    MessageV0,
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedTransaction
} from "@solana/web3.js";
import devWalletIdl from '../../packages/idl/dev/idl/chain_wallet.json';
import testWalletIdl from '../../packages/idl/test/idl/chain_wallet.json';
import mainWalletIdl from '../../packages/idl/main/idl/chain_wallet.json';
import devProxyIdl from '../../packages/idl/dev/idl/proxy.json';
import testProxyIdl from '../../packages/idl/test/idl/proxy.json';
import mainProxyIdl from '../../packages/idl/main/idl/proxy.json';
import {Rule} from "./rule-type";
import {replaceWith, uint8ArrayAlterFirst} from "../utils";

export class ChainWalletClient {

    private walletProgram: Program<ChainWallet>;

    private proxyProgram: Program<Proxy>;

    private provider: AnchorProvider;

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

        this.provider = new AnchorProvider(connect, dummyWallet, opt.confirmOptions);

        switch (network) {
            case 'Devnet':
                this.walletProgram = new Program(devWalletIdl as ChainWallet, this.provider);
                this.proxyProgram = new Program(devProxyIdl as Proxy, this.provider);
                break;
            case "Testnet":
                this.walletProgram = new Program(testWalletIdl as ChainWallet, this.provider);
                this.proxyProgram = new Program(testProxyIdl as Proxy, this.provider);
                break;
            case "Mainnet":
                this.walletProgram = new Program(mainWalletIdl as ChainWallet, this.provider);
                this.proxyProgram = new Program(mainProxyIdl as Proxy, this.provider);
                break;
        }
        const delayExecuteDiscriminator = this.walletProgram.coder.instruction.encode("delayExecute", []);
        this.delayExecuteDiscriminator = Uint8Array.from(delayExecuteDiscriminator);

    }

    public async executerTxConvert(tx: Transaction, wallet: PublicKey, executor: PublicKey): Promise<Transaction> {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let ins of instructions) {
            if (ins.keys.filter(d => d.pubkey.equals(wallet) && d.isSigner == true)) {
                const insNew = await this.proxyProgram.methods
                    .proxy(ins.data)
                    .accounts({
                        executor: executor,
                        custodyAccount: walletDataPubkey,
                        proxyProgram: ins.programId
                    })
                    .remainingAccounts(ins.keys).instruction();
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
    ): Promise<TransactionInstruction> {
        const nonce = new Date().getTime();
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
            name: name
        }).accounts({
            user: user,
        }).remainingAccounts(remainingAccounts)
            .instruction();
        return createIns;
    }


    public async managerExecuteTx(
        tx: Transaction,
        wallet: PublicKey,
        manager: PublicKey,
        pubkeyAndHashs: PubkeyWithSignHash[],
        nonce: number
    ) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let ins of instructions) {
            if (ins.keys.filter(d => d.pubkey.equals(wallet) && d.isSigner == true)) {
                const approvalParams = {
                    data: ins.data,
                    hashs: pubkeyAndHashs.map(d => Array.from(d.hashSign)),
                    nonce: new BN(nonce),
                };
                pubkeyAndHashs.forEach(d => {
                    ins.keys.unshift(
                        {
                            pubkey: d.wallet,
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
        let statusPass = status == 'normal' ? {locked: {}} : {normal: {}}
        const ins = await this.walletProgram.methods
            .statusChange(statusPass as any)
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

    public async delayExecuteTransaction(txHash: string): Promise<VersionedTransaction> {
        const transaction = await this.walletProgram.provider.connection.getTransaction(txHash,{
            maxSupportedTransactionVersion: 0,
            commitment:"confirmed",
            encoding: "base64"
        } as any);
        const b = Buffer.from(transaction!.transaction[0], 'base64');
        const txUse = VersionedTransaction.deserialize(b);
        const instructions: MessageCompiledInstruction[] = [];
        let executor: PublicKey ;
        for (let compiledInstruction of txUse.message.compiledInstructions) {
            if (txUse.message.staticAccountKeys[compiledInstruction.programIdIndex].toString() == this.proxyProgram.programId.toString()) {
                // delete index 5
                compiledInstruction.accountKeyIndexes.splice(5, 1);
                // delete index 3
                compiledInstruction.accountKeyIndexes.splice(3, 1);
                executor = txUse.message.staticAccountKeys[compiledInstruction.accountKeyIndexes[0]];
                uint8ArrayAlterFirst(compiledInstruction.data, this.delayExecuteDiscriminator);
                instructions.push(compiledInstruction);
            }
        }
        replaceWith(txUse.message.staticAccountKeys, this.proxyProgram.programId, this.walletProgram.programId, (a, b) => a.equals(b));

        const newMessage = new MessageV0({
            header: txUse.message.header,
            recentBlockhash: txUse.message.recentBlockhash,
            staticAccountKeys: txUse.message.staticAccountKeys,
            compiledInstructions: instructions,
            addressTableLookups: txUse.message.addressTableLookups,
        });

        return new VersionedTransaction(newMessage);
    }


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