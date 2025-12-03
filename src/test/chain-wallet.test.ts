import {ChainWalletClient, TransactionInstructionSignatureType} from "../chain-wallet/chain-wallet";
import {Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import {bs58} from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {AnchorProvider} from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {signHash32} from "../utils";
import stringify from "safe-stable-stringify";

require("dotenv").config();


describe("test chain wallet", () => {


    const chainWalletClient = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT
    });

    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));

    const chainWallet = new PublicKey(process.env.CHAIN_WALLET!);

    const nodeWallet = new NodeWallet(keypair);
    const nodeWallet2 = new NodeWallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY2!)));

    const custody = new PublicKey(process.env.CUSTODY!);

    const provider = new AnchorProvider(chainWalletClient.connect, nodeWallet);

    it("create wallet", async () => {
        const transaction = await chainWalletClient.createWallet(
            "Test wallet",
            keypair.publicKey,
            1,
            [keypair.publicKey],
            [keypair.publicKey]
        );
        const tx = await provider.sendAndConfirm(transaction, [keypair]);
        console.log(tx);
    })
    it("executor transfer", async () => {
        const transferTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: nodeWallet.publicKey,
                toPubkey: chainWallet,
                lamports: 2e9
            }),
            SystemProgram.transfer({
                fromPubkey: chainWallet,
                toPubkey: nodeWallet.publicKey,
                lamports: 1e9
            }),
            SystemProgram.transfer({
                fromPubkey: chainWallet,
                toPubkey: nodeWallet.publicKey,
                lamports: 0.99 * 1e9
            })
        );
        console.log(stringify(transferTx,null,2))
        // const convertTx = await chainWalletClient.executorTxConvert(transferTx, chainWallet, nodeWallet.publicKey);
        // const txSignature = await chainWalletClient.connect.sendTransaction(convertTx, [nodeWallet.payer]);
        // console.log(txSignature);
    })

    it("init fee", async () => {
        const transferTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: nodeWallet.publicKey,
                toPubkey: new PublicKey("ANSUPKasMgpWaAzg4JVQcryr6n9cU1Ts5KSRMowyRu3i"),
                lamports: await chainWalletClient.connect.getMinimumBalanceForRentExemption(0)
            }),
        );
        const txSignature = await chainWalletClient.connect.sendTransaction(transferTx, [nodeWallet.payer]);
        console.log(txSignature);
    })

    it("multi signature", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerChangeStatusInstruction(chainWallet, {delay:{"0":500}})
        const transferTx = new Transaction().add(
            ins
        );
        // console.log("transferTx is ",JSON.stringify(transferTx,null,2));
        const res = await chainWalletClient.decodeTransactionMultiSig(transferTx, chainWallet,BigInt(custodyAccount.approvalNonce[4]!.toNumber() + 1) );

        const signatures: TransactionInstructionSignatureType[] = res.map(d => {
                return ({
                    instructionIndex: d.instructionIndex,
                    nonce: d.nonce,
                    hash: d.hash,
                    signatures: [{
                        singer: nodeWallet.publicKey,
                        signature: Buffer.from(signHash32(d.hash, nodeWallet.payer))
                    }]
                });
            }
        );
        // console.log(stringify(signatures, null, 2));

        // const tx = await chainWalletClient.managerExecuteTx(transferTx, chainWallet, nodeWallet.publicKey, signatures);
        // // console.log("tx is ", JSON.stringify(tx, null, 2));
        // const txSignature = await chainWalletClient.connect.sendTransaction(tx, [nodeWallet.payer],);
        // console.log(txSignature);

    })

    it("multi signature change threshed", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerChangeThresholdInstruction(chainWallet, 1)
        const transferTx = new Transaction().add(
            ins
        );
        // console.log("transferTx is ",JSON.stringify(transferTx,null,2));
        const res = await chainWalletClient.decodeTransactionMultiSig(transferTx, chainWallet, BigInt(custodyAccount.approvalNonce[4]!.toNumber() + 1));

        const signatures: TransactionInstructionSignatureType[] = res.map(d => {
                return ({
                    instructionIndex: d.instructionIndex,
                    nonce: d.nonce,
                    hash: d.hash,
                    signatures: [{
                        singer: nodeWallet.publicKey,
                        signature: Buffer.from(signHash32(d.hash, nodeWallet.payer))
                        },
                        // {
                        //     singer: nodeWallet2.publicKey,
                        //     signature: Buffer.from(signHash32(d.hash, nodeWallet2.payer))
                        // }
                    ]
                });
            }
        );
        console.log(stringify(signatures, null, 2));

        const tx = await chainWalletClient.managerExecuteTx(transferTx, chainWallet, nodeWallet.publicKey, signatures);
        console.log(stringify(tx, null, 2));
        const txSignature = await chainWalletClient.connect.sendTransaction(tx, [nodeWallet.payer],);
        console.log(txSignature);

    })
    it("multi signature add manager", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerMangersAddInstruction(chainWallet, [nodeWallet2.publicKey])
        const transferTx = new Transaction().add(
            ins
        );
        // console.log("transferTx is ",JSON.stringify(transferTx,null,2));
        const res = await chainWalletClient.decodeTransactionMultiSig(transferTx, chainWallet, BigInt(custodyAccount.approvalNonce[4]!.toNumber() + 1));

        const signatures: TransactionInstructionSignatureType[] = res.map(d => {
                return ({
                    instructionIndex: d.instructionIndex,
                    nonce: d.nonce,
                    hash: d.hash,
                    signatures: [
                        {
                            singer: nodeWallet.publicKey,
                            signature: Buffer.from(signHash32(d.hash, nodeWallet.payer))
                        }
                    ]
                });
            }
        );
        console.log(stringify(signatures, null, 2));

        const tx = await chainWalletClient.managerExecuteTx(transferTx, chainWallet, nodeWallet.publicKey, signatures);
        const txSignature = await chainWalletClient.connect.sendTransaction(tx, [nodeWallet.payer],);
        console.log(txSignature);

    })

    it("multi signature remove manager", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", stringify(custodyAccount,null,2));
        const ins = await chainWalletClient.managerMangersDeleteInstruction(chainWallet, [1])
        const transferTx = new Transaction().add(
            ins
        );
        // console.log("transferTx is ",JSON.stringify(transferTx,null,2));
        const res = await chainWalletClient.decodeTransactionMultiSig(transferTx, chainWallet, BigInt(custodyAccount.approvalNonce[4]!.toNumber() + 1));

        const signatures: TransactionInstructionSignatureType[] = res.map(d => {
                return ({
                    instructionIndex: d.instructionIndex,
                    nonce: d.nonce,
                    hash: d.hash,
                    signatures: [
                        {
                            singer: nodeWallet.publicKey,
                            signature: Buffer.from(signHash32(d.hash, nodeWallet.payer))
                        }
                    ]
                });
            }
        );
        // console.log(stringify(signatures, null, 2));

        // const tx = await chainWalletClient.managerExecuteTx(transferTx, chainWallet, nodeWallet.publicKey, signatures);
        // const txSignature = await chainWalletClient.connect.sendTransaction(tx, [nodeWallet.payer],);
        // console.log(txSignature);

    })

    it("executor push delay", async ()=>{
        const transferTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: nodeWallet.publicKey,
                toPubkey: chainWallet,
                lamports: 2e9
            }),
            SystemProgram.transfer({
                fromPubkey: chainWallet,
                toPubkey: nodeWallet.publicKey,
                lamports: 1e9
            }),
            SystemProgram.transfer({
                fromPubkey: chainWallet,
                toPubkey: nodeWallet.publicKey,
                lamports: 0.99 * 1e9
            })
        );
        console.log(stringify(transferTx,null,2));
        const convertTx = await chainWalletClient.executorTxConvert(transferTx, chainWallet, nodeWallet.publicKey);
        console.log(stringify(convertTx, null, 2));
        // const convertDelayTx = await chainWalletClient.delayExecuteVersionTransaction(convertTx,nodeWallet.publicKey);
        // convertDelayTx.sign([nodeWallet.payer]);
        const convertDelayTx = await chainWalletClient.delayExecuteTransaction(convertTx,nodeWallet.publicKey);
        console.log(stringify(convertDelayTx, null, 2));
        const txSignature = await chainWalletClient.connect.sendTransaction(convertDelayTx,[nodeWallet.payer]);
        console.log(txSignature);
    })
})