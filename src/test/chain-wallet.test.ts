import {ChainWalletClient} from "../chain-wallet";
import {Keypair, PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
import {bs58} from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {AnchorProvider, BorshCoder} from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import stringify from "safe-stable-stringify";
import devWalletIdl from '../idl/devnet/chain_wallet.json';
import {ChainWallet} from "../idl/chain_wallet";

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

    })

    it("multi signature change threshed", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerChangeThresholdInstruction(chainWallet, 1)

    })
    it("multi signature add manager", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", custodyAccount);
        const ins = await chainWalletClient.managerMangersAddInstruction(chainWallet, [nodeWallet2.publicKey])

    })

    it("multi signature remove manager", async () => {
        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("custody", stringify(custodyAccount,null,2));
        const ins = await chainWalletClient.managerMangersDeleteInstruction(chainWallet, [1])
        const transferTx = new Transaction().add(
            ins
        );

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

    it("test decode multisigPush data", async () => {
        console.log("=== Testing multisigPush data decoding ===\n");
        
        // 1. 创建一个原始指令
        const originalInstruction = SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: chainWallet,
            lamports: 1e9
        });
        
        console.log("Original instruction data:", Buffer.from(originalInstruction.data).toString('hex'));
        
        // 2. 创建 multisigPush 指令
        const pushInstruction = await chainWalletClient.multisigPushInstruction(
            originalInstruction,
            chainWallet,
            keypair.publicKey,
            "test decode remark"
        );
        
        console.log("\n=== MultisigPush Instruction ===");
        console.log("Program ID:", pushInstruction.programId.toString());
        console.log("Data length:", pushInstruction.data.length);
        console.log("Full data (hex):", Buffer.from(pushInstruction.data).toString('hex'));
        
        // 3. 解码指令
        const coder = new BorshCoder(devWalletIdl as ChainWallet);
        
        // 跳过前8字节的 discriminator
        const discriminator = pushInstruction.data.slice(0, 8);
        const paramsData = pushInstruction.data.slice(8);
        
        console.log("\n=== Decoding Process ===");
        console.log("Discriminator (8 bytes):", Buffer.from(discriminator).toString('hex'));
        console.log("Params data length:", paramsData.length);
        
        try {
            // 使用 coder.types.decode 解码参数
            const decoded = coder.types.decode("MultisigPushParams", paramsData);
            
            console.log("\n=== Decoded Result ===");
            console.log("Full decoded object:");
            console.log(JSON.stringify(decoded, (key, value) => {
                if (value instanceof Uint8Array || value instanceof Buffer) {
                    return {
                        type: 'Buffer',
                        hex: Buffer.from(value).toString('hex'),
                        length: value.length
                    };
                }
                return value;
            }, 2));
            
            console.log("\n=== Extracted Fields ===");
            console.log("Remark:", decoded.remark);
            console.log("Data type:", decoded.data?.constructor?.name || typeof decoded.data);
            console.log("Data length:", decoded.data?.length);
            console.log("Data (hex):", decoded.data ? Buffer.from(decoded.data).toString('hex') : 'null');
            
            // 验证解码的 data 是否与原始指令的 data 相同
            if (decoded.data) {
                const matches = Buffer.from(decoded.data).equals(Buffer.from(originalInstruction.data));
                console.log("\n=== Verification ===");
                console.log("Decoded data matches original instruction:", matches);
            }
            
        } catch (error) {
            console.error("\n=== Decode Error ===");
            console.error(error);
        }
    })
})