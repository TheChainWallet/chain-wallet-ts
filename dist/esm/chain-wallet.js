import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { ACCOUNR_SEED, DEFAULT_NET_WORK, getDefaultEndpoint } from "./constansts";
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import devWalletIdl from './idl/devnet/chain_wallet.json';
// import testWalletIdl from '../../packages/idl/test/idl/chain_wallet.json';
import mainWalletIdl from './idl/mainnet/chain_wallet.json';
import { getTransactionHashWithNonce, toVersionTransaction, uint8ArrayAlterFirst } from "./utils";
import { assertTrue, NotSupportError, ValidationError } from "./error";
export class ChainWalletClient {
    walletProgram;
    provider;
    connect;
    delayExecuteDiscriminator;
    executeDiscriminator;
    constructor(opt) {
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
                this.walletProgram = new Program(devWalletIdl, this.provider);
                break;
            case "Testnet":
                throw new NotSupportError("not supported testnet");
            case "Mainnet":
                this.walletProgram = new Program(mainWalletIdl, this.provider);
                break;
        }
        const delayExecuteDiscriminator = this.walletProgram.coder.instruction.encode("delayExecute", []);
        this.delayExecuteDiscriminator = Uint8Array.from(delayExecuteDiscriminator);
        const executeDiscriminator = this.walletProgram.coder.instruction.encode("execute", []);
        this.executeDiscriminator = Uint8Array.from(executeDiscriminator);
    }
    async executorTxConvert(tx, wallet, executor) {
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
            }
            else {
                txNew.add(ins);
            }
        }
        return txNew;
    }
    findWalletDataPubkeyByWallet(wallet) {
        const [walletDataPubkey, _] = PublicKey.findProgramAddressSync([Buffer.from(ACCOUNR_SEED), wallet.toBuffer()], this.walletProgram.programId);
        return walletDataPubkey;
    }
    async createWallet(name, user, threshold, executors, userAdmins) {
        const nonce = new Date().getTime();
        const nonceSeed = Buffer.alloc(8);
        nonceSeed.writeBigUInt64LE(BigInt(nonce));
        const [wallet, _] = PublicKey.findProgramAddressSync([Buffer.from("wallet"), nonceSeed], this.walletProgram.programId);
        const remainingAccounts = [];
        executors.forEach(d => {
            remainingAccounts.push({ isSigner: false, isWritable: false, pubkey: d });
        });
        userAdmins.forEach(d => {
            remainingAccounts.push({ isSigner: false, isWritable: false, pubkey: d });
        });
        const createIns = await this.walletProgram.methods.create({
            nonce: new BN(nonce),
            status: { normal: {} },
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
        const createTx = new Transaction().add(SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: wallet,
            lamports: await this.connect.getMinimumBalanceForRentExemption(0, "processed")
        }), createIns);
        return createTx;
    }
    async managerExecuteTx(tx, wallet, manager, pubkeyAndHashs) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new Transaction();
        for (let [index, ins] of instructions.entries()) {
            if (pubkeyAndHashs.find(item => item.instructionIndex == index)) {
                const transactionInstructionSignature = pubkeyAndHashs.find(item => item.instructionIndex == index);
                const approvalParams = {
                    data: ins.data,
                    hashs: transactionInstructionSignature.signatures.map(item => Array.from(item.signature)),
                    nonce: new BN(transactionInstructionSignature.nonce),
                };
                let signatures = transactionInstructionSignature?.signatures;
                signatures?.reverse();
                signatures?.forEach(d => {
                    ins.keys.unshift({
                        pubkey: d.singer,
                        isSigner: false,
                        isWritable: true
                    });
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
            }
            else {
                txNew.add(ins);
            }
        }
        return txNew;
    }
    async convertToMultiSigInstruction(instruction, wallet, nonce) {
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
        };
    }
    async convertToMultiSigTx(tx, wallet, nonce) {
        const hashIndexes = [];
        for (let [index, instruction] of tx.instructions.entries()) {
            if (instruction.keys.find(item => item.pubkey.equals(wallet) && item.isSigner)) {
                const instructionWithHash = await this.convertToMultiSigInstruction(instruction, wallet, nonce);
                instruction = instructionWithHash.instruction;
                nonce++;
                hashIndexes.push({ hash: instructionWithHash.hash, transactionIndex: index });
            }
        }
        return {
            tx: tx,
            hashIndexes: hashIndexes,
        };
    }
    async managerExecutorDeleteInstruction(wallet, executorIndexs) {
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
    async managerExecutorAddInstruction(wallet, executorPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorAdd({
            executorNum: executorPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(executorPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerExecutorReplaceInstruction(wallet, executorPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .executorChange({
            executorNum: executorPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(executorPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerMangersDeleteInstruction(wallet, managerIndexs) {
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
    async managerMangersAddInstruction(wallet, managerPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerAdd({
            managerNum: managerPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(managerPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerMangersReplaceInstruction(wallet, managerPublicKeys) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .managerChange({
            managerNum: managerPublicKeys.length
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).remainingAccounts(managerPublicKeys.map(d => {
            return { isSigner: false, isWritable: false, pubkey: d };
        })).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerChangeThresholdInstruction(wallet, threshold) {
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
    async managerChangeStatusInstruction(wallet, status) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .statusChange({
            status: status
        })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    changeInstructionNotSign(ins, wallet) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        ins.keys = ins.keys.map(item => {
            const isExcluded = item.pubkey.equals(walletDataPubkey) || item.pubkey.equals(wallet);
            return ({
                isSigner: isExcluded ? false : item.isSigner,
                isWritable: item.isWritable,
                pubkey: item.pubkey
            });
        });
        return ins;
    }
    async managerRuleChangeInstruction(wallet, rules) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleChange({ rules: rules })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerRuleAddInstruction(wallet, rules) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods.ruleAdd({ rules: rules })
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        })
            .instruction();
        this.changeInstructionNotSign(ins, wallet);
        return ins;
    }
    async managerRuleDeleteInstruction(wallet, ruleIndexs) {
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
    async delayExecuteVersionTransaction(transaction, newExecutor) {
        const transactionAfter = await this.delayExecuteTransaction(transaction, newExecutor);
        const repo = await this.connect.getLatestBlockhash();
        return toVersionTransaction(transactionAfter, newExecutor, repo.blockhash);
    }
    async delayExecuteTransaction(transaction, newExecutor) {
        for (let instruction of transaction.instructions) {
            if (instruction.programId.toString() == this.walletProgram.programId.toString() &&
                instruction.data.subarray(0, 8).equals(Buffer.from(this.executeDiscriminator))) {
                uint8ArrayAlterFirst(instruction.data, this.delayExecuteDiscriminator);
                instruction.keys[0].pubkey = newExecutor;
            }
        }
        return transaction;
    }
    async decodeVersionTransactionMultiSig(versionedTransaction, wallet, nonce) {
        const proposalTransactionInstructions = [];
        // If have look table. get look table
        const publicKeys = versionedTransaction.message.staticAccountKeys;
        const compiledInstructions = versionedTransaction.message.compiledInstructions;
        assertTrue(compiledInstructions.length !== 0, new ValidationError("No multi sig instruction found."));
        for (let addressTableLookup of versionedTransaction.message.addressTableLookups) {
            const res = await this.connect.getAddressLookupTable(addressTableLookup.accountKey);
            if (res.value?.state.addresses) {
                publicKeys.push(...res.value?.state.addresses);
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
                keys: mci.accountKeyIndexes.map((i) => ({
                    pubkey: publicKeys[i],
                    isSigner: versionedTransaction.message.isAccountSigner(i),
                    isWritable: versionedTransaction.message.isAccountWritable(i),
                })),
            });
            if (ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))) {
                const hashBuffer = getTransactionHashWithNonce(instructionForSigning, 0, nonce + nonceInsNum);
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
    async decodeTransactionMultiSig(transaction, wallet, nonce) {
        const proposalTransactionInstructions = [];
        let nonceInsNum = nonce;
        for (const [i, instructionForSigning] of transaction.instructions.entries()) {
            const ixData = Buffer.from(instructionForSigning.data);
            if (ixData.length >= 8 &&
                instructionForSigning.keys.find((item) => item.pubkey.equals(wallet))) {
                const hashBuffer = getTransactionHashWithNonce(instructionForSigning, 0, nonceInsNum);
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
const dummyWallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
};
//# sourceMappingURL=chain-wallet.js.map