"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainWalletClient = void 0;
const anchor_1 = require("@coral-xyz/anchor");
const constansts_1 = require("../constansts");
const web3_js_1 = require("@solana/web3.js");
const chain_wallet_json_1 = __importDefault(require("../../packages/idl/devnet/chain_wallet.json"));
// import testWalletIdl from '../../packages/idl/test/idl/chain_wallet.json';
const chain_wallet_json_2 = __importDefault(require("../../packages/idl/mainnet/chain_wallet.json"));
const utils_1 = require("../utils");
const error_1 = require("../error");
class ChainWalletClient {
    constructor(opt) {
        let network = constansts_1.DEFAULT_NET_WORK;
        if (opt?.network) {
            network = opt?.network;
        }
        let endpoint = (0, constansts_1.getDefaultEndpoint)(network);
        if (opt?.endpoint) {
            endpoint = opt.endpoint;
        }
        const connect = new web3_js_1.Connection(endpoint);
        this.connect = connect;
        this.provider = new anchor_1.AnchorProvider(connect, dummyWallet, opt?.confirmOptions);
        switch (network) {
            case 'Devnet':
                this.walletProgram = new anchor_1.Program(chain_wallet_json_1.default, this.provider);
                break;
            case "Testnet":
                throw new error_1.NotSupportError("not supported testnet");
            case "Mainnet":
                this.walletProgram = new anchor_1.Program(chain_wallet_json_2.default, this.provider);
                break;
        }
        const delayExecuteDiscriminator = this.walletProgram.coder.instruction.encode("delayExecute", []);
        this.delayExecuteDiscriminator = Uint8Array.from(delayExecuteDiscriminator);
    }
    async executorTxConvert(tx, wallet, executor) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new web3_js_1.Transaction();
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
            }
            else {
                txNew.add(ins);
            }
        }
        return txNew;
    }
    findWalletDataPubkeyByWallet(wallet) {
        const [walletDataPubkey, _] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constansts_1.ACCOUNR_SEED), wallet.toBuffer()], this.walletProgram.programId);
        return walletDataPubkey;
    }
    async createWallet(name, user, threshold, executors, userAdmins) {
        const nonce = new Date().getTime();
        const nonceSeed = Buffer.alloc(8);
        nonceSeed.writeBigUInt64LE(BigInt(nonce));
        const [wallet, _] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("wallet"), nonceSeed], this.walletProgram.programId);
        const remainingAccounts = [];
        executors.forEach(d => {
            remainingAccounts.push({ isSigner: false, isWritable: false, pubkey: d });
        });
        userAdmins.forEach(d => {
            remainingAccounts.push({ isSigner: false, isWritable: false, pubkey: d });
        });
        const createIns = await this.walletProgram.methods.create({
            nonce: new anchor_1.BN(nonce),
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
        const createTx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: wallet,
            lamports: await this.connect.getMinimumBalanceForRentExemption(0, "processed")
        }), createIns);
        return createTx;
    }
    async managerExecuteTx(tx, wallet, manager, pubkeyAndHashs) {
        let instructions = tx.instructions;
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const txNew = new web3_js_1.Transaction();
        for (let [index, ins] of instructions.entries()) {
            if (pubkeyAndHashs.find(item => item.instructionIndex == index)) {
                const transactionInstructionSignature = pubkeyAndHashs.find(item => item.instructionIndex == index);
                const approvalParams = {
                    data: ins.data,
                    hashs: transactionInstructionSignature.signatures.map(item => Array.from(item.signature)),
                    nonce: new anchor_1.BN(transactionInstructionSignature.nonce),
                };
                transactionInstructionSignature.signatures.forEach(d => {
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
            nonce: new anchor_1.BN(nonce),
        };
        const ins = await this.walletProgram.methods
            .approval(approvalParams)
            .accounts({
            user: wallet,
            custodyAccount: walletDataPubkey,
            proxyProgram: this.walletProgram.programId,
        })
            .remainingAccounts(instruction.keys).instruction();
        const hash = (0, utils_1.getTransactionHashWithNonce)(ins, 0, BigInt(nonce));
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
        return ins;
    }
    async managerChangeStatusInstruction(wallet, status) {
        const walletDataPubkey = this.findWalletDataPubkeyByWallet(wallet);
        const ins = await this.walletProgram.methods
            .statusChange(status)
            .accounts({
            manager: wallet,
            custodyAccount: walletDataPubkey
        }).instruction();
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
        return ins;
    }
    async delayExecuteTransaction(txHash) {
        const transaction = await this.walletProgram.provider.connection.getTransaction(txHash, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
            encoding: "base64"
        });
        const b = Buffer.from(transaction.transaction[0], 'base64');
        const txUse = web3_js_1.VersionedTransaction.deserialize(b);
        const instructions = [];
        let executor;
        for (let compiledInstruction of txUse.message.compiledInstructions) {
            if (txUse.message.staticAccountKeys[compiledInstruction.programIdIndex].toString() == this.walletProgram.programId.toString()) {
                // delete index 5
                compiledInstruction.accountKeyIndexes.splice(5, 1);
                // delete index 3
                compiledInstruction.accountKeyIndexes.splice(3, 1);
                executor = txUse.message.staticAccountKeys[compiledInstruction.accountKeyIndexes[0]];
                (0, utils_1.uint8ArrayAlterFirst)(compiledInstruction.data, this.delayExecuteDiscriminator);
                instructions.push(compiledInstruction);
            }
        }
        (0, utils_1.replaceWith)(txUse.message.staticAccountKeys, this.walletProgram.programId, this.walletProgram.programId, (a, b) => a.equals(b));
        const newMessage = new web3_js_1.MessageV0({
            header: txUse.message.header,
            recentBlockhash: txUse.message.recentBlockhash,
            staticAccountKeys: txUse.message.staticAccountKeys,
            compiledInstructions: instructions,
            addressTableLookups: txUse.message.addressTableLookups,
        });
        return new web3_js_1.VersionedTransaction(newMessage);
    }
    async decodeTransactionMultiSig(versionedTransaction, wallet, nonce) {
        const proposalTransactionInstructions = [];
        // If have look table. get look table
        const publicKeys = versionedTransaction.message.staticAccountKeys;
        const compiledInstructions = versionedTransaction.message.compiledInstructions;
        (0, error_1.assertTrue)(compiledInstructions.length !== 0, new error_1.ValidationError("No multi sig instruction found."));
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
            const instructionForSigning = new web3_js_1.TransactionInstruction({
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
                const hashBuffer = (0, utils_1.getTransactionHashWithNonce)(instructionForSigning, 0, nonce + nonceInsNum);
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
exports.ChainWalletClient = ChainWalletClient;
const dummyWallet = {
    publicKey: new web3_js_1.PublicKey("11111111111111111111111111111111"),
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
};
