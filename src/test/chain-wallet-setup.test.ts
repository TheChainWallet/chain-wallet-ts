/**
 * 链上钱包创建测试
 *
 * 此测试会创建一个新的链上钱包，并输出所有必要的配置信息供后续测试使用。
 * 运行后请将输出的配置复制到 .env 文件中。
 */

import {ChainWalletClient} from "../chain-wallet";
import {Keypair, PublicKey} from "@solana/web3.js";
import {AnchorProvider} from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {bs58} from "@coral-xyz/anchor/dist/cjs/utils/bytes";

require("dotenv").config();

describe("Chain Wallet Setup", () => {
    const chainWalletClient = new ChainWalletClient({
        network: "Devnet",
        endpoint: process.env.ENDPOINT
    });

    it("create wallet and generate .env config", async () => {
        // 生成两个新的 manager 密钥对
        const manager1Keypair = Keypair.generate();
        const manager2Keypair = Keypair.generate();

        console.log("\n=== 生成的密钥对 ===");
        console.log("Manager 1 (也是 Executor):");
        console.log("  公钥:", manager1Keypair.publicKey.toBase58());
        console.log("  私钥:", bs58.encode(manager1Keypair.secretKey));
        console.log("\nManager 2:");
        console.log("  公钥:", manager2Keypair.publicKey.toBase58());
        console.log("  私钥:", bs58.encode(manager2Keypair.secretKey));

        // 使用有 SOL 的账户作为创建者和付款人
        // 如果 .env 中有 PRIVATE_KEY，使用它；否则提示用户
        let funderKeypair: Keypair;
        if (process.env.PRIVATE_KEY) {
            funderKeypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
            console.log("\n使用 .env 中的 PRIVATE_KEY 作为付款人:", funderKeypair.publicKey.toBase58());
        } else {
            throw new Error("\n请在 .env 文件中设置 PRIVATE_KEY（一个有 SOL 的账户）");
        }

        // 创建钱包
        const nodeWallet = new NodeWallet(funderKeypair);
        const provider = new AnchorProvider(chainWalletClient.connect, nodeWallet);

        const nonce = Date.now();
        console.log("\n=== 创建钱包 ===");
        console.log("Nonce:", nonce);

        const transaction = await chainWalletClient.createWallet(
            "Test Wallet",
            funderKeypair.publicKey,
            1, // threshold = 1，单签即可
            [manager1Keypair.publicKey], // executor
            [manager1Keypair.publicKey, manager2Keypair.publicKey], // managers
            nonce
        );

        // 上链创建钱包
        const tx = await provider.sendAndConfirm(transaction, [funderKeypair]);
        console.log("创建交易签名:", tx);

        // 计算钱包和 custody 地址
        const nonceSeed = new Uint8Array(8);
        const view = new DataView(nonceSeed.buffer);
        view.setBigUint64(0, BigInt(nonce), true);
        const walletSeed = new TextEncoder().encode("wallet");

        const [wallet, _] = PublicKey.findProgramAddressSync(
            [walletSeed, nonceSeed],
            chainWalletClient.walletProgram.programId
        );

        const custody = chainWalletClient.findWalletDataPubkeyByWallet(wallet);

        console.log("\n=== 链上地址 ===");
        console.log("CHAIN_WALLET:", wallet.toBase58());
        console.log("CUSTODY:", custody.toBase58());

        // 验证钱包已创建
/*        const custodyAccount = await chainWalletClient.walletProgram.account.custodyAccount.fetch(custody);
        console.log("\n=== 钱包信息 ===");
        console.log("Wallet:", custodyAccount.wallet.toBase58());
        console.log("Managers:", custodyAccount.managers.map(m => m.toBase58()));
        console.log("Executors:", custodyAccount.executors.map(e => e.toBase58()));
        console.log("Threshold:", custodyAccount.threshold);*/

        console.log("\n=== .env 配置 ===");
        console.log("请将以下内容复制到 .env 文件:\n");
        console.log(`ENDPOINT=${process.env.ENDPOINT || "https://api.devnet.solana.com/"}`);
        console.log(`PRIVATE_KEY=${bs58.encode(manager1Keypair.secretKey)}`);
        console.log(`PRIVATE_KEY2=${bs58.encode(manager2Keypair.secretKey)}`);
        console.log(`CHAIN_WALLET=${wallet.toBase58()}`);
        console.log(`CUSTODY=${custody.toBase58()}`);
    }, 60000);
});

